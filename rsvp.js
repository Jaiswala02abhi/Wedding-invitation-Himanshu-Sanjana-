/* The RSVP boarding pass.

   The same questions as template-1: name, phone number, "Joyfully yes" or
   "Regretfully no", how many guests, and a message. The guest count only
   shows while the answer is yes, and the send button says back whatever the
   guest is about to send.

   Sending it stamps the pass and turns it into their issued ticket: their
   name and party size, or a "regrets" pass when they cannot come.

   This is a sample invitation: the reply is gathered, logged and
   acknowledged, and nothing leaves the page. See the note by the submit
   handler for wiring it to a real endpoint. */
window.Rsvp = (function () {
  'use strict';

  var MAX_GUESTS = 10;

  /* "Shreya Sharma" becomes "Shreya" — a whole name reads like a register
     entry. */
  function firstName(full) {
    return full.split(/\s+/)[0] || 'friend';
  }

  function init() {
    var form = document.getElementById('rsvp-form');
    if (!form) return;

    var pass = form.closest('.pass');
    var guests = document.getElementById('rsvp-guests');
    var count = document.getElementById('rsvp-count');
    var send = document.getElementById('rsvp-send');
    var again = document.getElementById('rsvp-again');
    var choices = form.querySelectorAll('[name="attendingStatus"]');

    var required = [
      { input: form.fullName, error: document.getElementById('rsvp-name-error') },
      { input: form.phoneNumber, error: document.getElementById('rsvp-phone-error') }
    ];

    var issued = {
      panel: document.getElementById('rsvp-thanks'),
      stamp: document.getElementById('rsvp-stamp'),
      name: document.getElementById('rsvp-thanks-name'),
      summary: document.getElementById('rsvp-thanks-summary'),
      seats: document.getElementById('rsvp-thanks-seats'),
      note: document.getElementById('rsvp-thanks-note')
    };

    function coming() {
      return choices[0].checked;
    }

    function label() {
      return coming() ? 'Send RSVP' : 'Send my regrets';
    }

    /* ---- Yes / No ---------------------------------------------------------- */

    function paint() {
      guests.hidden = !coming();
      send.textContent = label();
    }

    choices.forEach(function (choice) {
      choice.addEventListener('change', paint);
    });

    required.forEach(function (field) {
      field.input.addEventListener('input', function () {
        if (!field.input.value.trim()) return;
        field.error.hidden = true;
        field.input.classList.remove('is-bad');
      });
    });

    /* ---- The guest counter ------------------------------------------------- */

    form.querySelectorAll('[data-step]').forEach(function (button) {
      button.addEventListener('click', function () {
        var next = Number(count.value) + Number(button.getAttribute('data-step'));
        count.value = Math.max(1, Math.min(MAX_GUESTS, next));
      });
    });

    /* ---- Issuing the pass -------------------------------------------------- */

    function issue(reply, yes) {
      pass.classList.toggle('is-regret', !yes);
      issued.stamp.textContent = yes ? 'Confirmed' : 'Missed you';
      issued.name.textContent = reply.fullName;
      issued.summary.hidden = !yes;
      again.textContent = yes ? 'Send another response' : 'Change my answer';

      if (yes) {
        issued.seats.textContent = reply.numberOfGuests;
        issued.note.textContent = (window.__WV_RSVPTXT && window.__WV_RSVPTXT.yes) || 'Your reply is safely with us. We cannot wait to see you there.';
      } else {
        issued.note.textContent = 'You will be missed, ' + firstName(reply.fullName) + '. ' +
          ((window.__WV_RSVPTXT && window.__WV_RSVPTXT.no) || 'If your plans ever change, your seat will always be here for you.');
      }

      form.hidden = true;
      issued.panel.hidden = false;
      pass.classList.add('is-issued');
      issued.panel.focus();
    }

    /* ---- Send -------------------------------------------------------------- */

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var firstMissing = null;
      required.forEach(function (field) {
        var empty = !field.input.value.trim();
        field.error.hidden = !empty;
        field.input.classList.toggle('is-bad', empty);
        if (empty && !firstMissing) firstMissing = field.input;
      });

      if (firstMissing) { firstMissing.focus(); return; }

      var yes = coming();

      var reply = {
        fullName: form.fullName.value.trim(),
        phoneNumber: form.phoneNumber.value.trim(),
        attendingStatus: yes ? choices[0].value : choices[1].value,
        numberOfGuests: yes ? Number(count.value) : 0,
        message: form.message.value.trim(),
        timestamp: new Date().toLocaleString()
      };

      send.disabled = true;
      send.textContent = yes ? 'Sending...' : 'Sending your note...';

      /* Nothing leaves the page. To collect real replies, POST `reply` to the
         couple's own endpoint — a Google Apps Script web app writing to a
         Sheet works well — and issue the pass once it resolves. */
      /* Wedvo: the reply is kept for the couple (they see it on their replies page). */
      if (window.__WV_RSVP) fetch(window.__WV_RSVP, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(reply) }).catch(function () {});

      setTimeout(function () {
        issue(reply, yes);

        /* The guest count and the attending choice keep their answers, so a
           second reply for the same household starts where this one left
           off. */
        form.fullName.value = '';
        form.phoneNumber.value = '';
        form.message.value = '';

        send.disabled = false;
        send.textContent = label();
      }, 700);
    });

    /* ---- Back to the form -------------------------------------------------- */

    again.addEventListener('click', function () {
      issued.panel.hidden = true;
      pass.classList.remove('is-issued', 'is-regret');
      form.hidden = false;
      form.fullName.focus();
    });

    paint();
  }

  return { init: init };
})();
