document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  
  // By default, load the inbox
  load_mailbox('inbox');
  // load_mailbox('inbox');
  
  // listen to click on the whole object 
  document.addEventListener('click', event => {
    const element = event.target;
    if (element.className === 'hide') {
      element.parentElement.style.animationPlayState = 'running';
      element.parentElement.addEventListener('animationend', () => {

        element.parentElement.remove();
      })
    }
  })

});


// Send Mail
function compose_email() {

    // Compose email
    document.querySelector('#compose-form').onsubmit = function() {
      const form = document.querySelector('#compose-view');

      const emailRecipients = document.querySelector('#compose-recipients').value;
      const emailSubject = document.querySelector('#compose-subject').value;
      const emailBody = document.querySelector('#compose-body').value;


      // ask user to confirm that they are sending without subject and body
      if (emailSubject.length == 0 && emailBody.length === 0 && emailRecipients.length > 0 ) {

        const txt = "Send this message without a subject and text in the body?";

        // ask users if they want to send a message without subject and body

        if (confirm(txt) === false) {
          return false;
        }
      }
      // fetch the data
      fetch('https://django-js-mail.onrender.com/emails', {
        method: 'POST',
        body: JSON.stringify({
          recipients: emailRecipients,
          subject: emailSubject,
          body: emailBody,
        })
      })      
  
      .then(response =>  response.json())
      .then(result => {

        // display the error, 
        if (result.error) {   

          // change error message if there is one before
          if (form.querySelector('#compose-message')) {
            form.querySelector('#compose-message').innerHTML = `${result.error} <button class='hide'>X</button>`;

          } else {
            // create a new div which display the new error
            const div = document.createElement('div');
            div.id = 'compose-message';
            div.innerHTML = `${result.error} <button class='hide'>X</button>`;
            form.insertBefore(div, form.children[1])
          }
          return;
        }
        // send the user to sent page/ portion (its like redirecting a user)
        load_mailbox('sent')

        // new div to diplay success message
        const div = document.createElement('div');
        div.id = 'sent-message';
        div.innerHTML = `${result.message} <button class='hide'>X</button>`;
        document.querySelector('#emails-view').insertBefore(div, document.querySelector('#emails-view').children[1]);
        
      })
      
      .catch(error => {
        console.log("Error", error);
        return location.reload();
      })

      return false;
    }  
       
    if (document.querySelector('#compose-message')) {
      document.querySelector('#compose-message').innerHTML = "";
    }

  // Show compose view and hide other views
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#detail-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  document.querySelector('#to').style.display = 'none';

  // add a "To" on left side of recipients input area when the user focus on it, change the padding
  document.querySelector('#compose-recipients').addEventListener('focus', () => {

    document.querySelector('#to').style.display = 'table-cell';
    document.querySelector("#compose-recipients").style.paddingLeft = "0px";
    // remove the placeholder
    document.querySelector("#compose-recipients").placeholder = "";
  
  });

  // remove the "To" text when the user focus out from the recipient area
  document.querySelector('#compose-recipients').addEventListener('focusout', () => {

    document.querySelector('#to').style.display = 'none';
    document.querySelector("#compose-recipients").style.paddingLeft = "20px";
    // return the place holder
    document.querySelector("#compose-recipients").placeholder = "Recipients";

  });
}

// Mailbox
function load_mailbox(mailbox) {

  // check if the ${mailbox} is inbox, sent or archive
  fetch(`https://django-js-mail.onrender.com/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    
    // show the error
    if (emails.error) {
      error(emails.error);

    }

    // remove the loading svg if it exist
    if (document.querySelector('#emails-view').querySelector('.spinner')) {
      document.querySelector('#emails-view').querySelector('.spinner').remove()
    }

    // check if emails exist
    if (emails.length === 0) {

      // create new element
      const li = document.createElement('li');
      li.className = 'no-email';
      
      // add a message
      li.innerHTML = `No ${mailbox}${mailbox === 'archive' ? "d" : ""} E-mail Yet.`;

      // append it to the the emial view div then return
      document.querySelector('#emails-view').append(li);
      return;
    }
    emails.forEach(email => {

      // classify each email based on their .read and mailbox value
      const div = document.createElement('div');
    
      // inbox and read
      if ((mailbox === 'inbox') && (email.read === true) ) {
        div.className = 'mailbox read'; 
      } else {
        div.className = 'mailbox';
      }
      
      // check for subject of the email if its empty, RE: and othere
      const subject = send_subject(email.subject);

      if (mailbox === 'sent')  { 
        div.innerHTML =  `<div class='recipient'>To: ${email.recipients}</div> <div class='subject'>${subject}</div> <div class='time'>${email.timestamp}</div>`;

      } else {
        div.innerHTML =  `<div class='recipient'>From: ${email.sender}</div> <div class='subject'>${subject}</div> <div  class='time'>${email.timestamp}</div>`;
      }


      document.querySelector('#emails-view').append(div)

      // listen for click for all of the emails
      div.addEventListener('click', () => {
        load_detail(email.id, mailbox)       
      });
    });
  })
 
  // Error     
  .catch(error => {
    console.log("Error", error);
  });
  

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#detail-view').style.display = 'none';


  // Create new spinner div
  const spin = document.createElement('div');
  spin.className = "spinner";

  // Get loading svg
  spin.innerHTML =  getSvg();

  // Show the mailbox name and add the spinner
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  document.querySelector('#emails-view').append(spin);
}

// View Email in detail
function load_detail(email_id, mailbox) {

  // ask for the data
  fetch(`https://django-js-mail.onrender.com/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    // display error to the user
    if (email.error) {
      error(email.error);
    }

    // change the value of read to true
    if(!email.read) {
      change_read(email.id);
    }

    // make the detail-view div empty
    const list = document.getElementById("detail-view")
    list.innerHTML = '';
  
    // create new div, add data to it
    const element = document.createElement('div');
    element.className = 'inbox';

    // body of the page replace all \n to <br>
    const body = email.body.replaceAll('\n', '<br>');

    // check if there is a subject or not
    const subject = send_subject(email.subject);

    let mailArchive;

    if (email.archived == false) {
      mailArchive = `<button id='archive' class='btn btn-outline-primary'  data-id=${email.id}>Archive</button>`
    } else {
      mailArchive = `<button id='archive' class='btn btn-outline-warning'  data-id=${email.id}>Unarchive</button>`
    }
    // add reply and arhieve if the mailbox is inbox     
    if (mailbox === 'inbox' || mailbox == 'archive') {
      element.innerHTML = `<div class='subject'><h4>${subject}</h4></div>
                          <div class='top-mailbox'>
      
                              <div class='mailbox-content'>
                                <div><strong>From: </strong>${email.sender}</div> 
                                <div><strong>To: </strong>${email.recipients}</div> 
                                <div><strong>Timestamp: </strong>${email.timestamp}</div>
                              </div>
                              <div class='side-mailbox'> 
                                <div><button id='reply' class='btn btn-outline-primary' data-id='${email.id}'>Reply</button></div>
                                <div>${mailArchive}</div>
                              </div>
                          </div>
                          <hr>
                          <div>${body}</div>`;
      
    } else {
        element.innerHTML = `<div class='subject'><h4>${subject}</h4></div>
                            <hr>
                          <div class='top-mailbox'>
                              <div>
                                <div><strong>From: </strong>${email.sender}</div> 
                                <div><strong>To: </strong>${email.recipients}</div>  
                                <div><strong>Timestamp: </strong>${email.timestamp}</div>
                              </div>
                            </div>
                            <hr>
                            <div>${body}</div>`;
      }
    

    document.querySelector('#detail-view').append(element);
    

    // Show the detail and hide other views
    document.querySelector('#detail-view').style.display = 'block';    
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';


    // wait for the user to click the reply, archive button
    element.addEventListener('click', event => {

      const button = event.target;
      if (button.id === 'reply') {
        reply(button.dataset.id);

      } else {
        if (button.id === 'archive') {
          archive(button.dataset.id, email.archived);

        }
      }
    })
  
  });
} 

// PUT read to be true
function change_read(id) {
  fetch( `https://django-js-mail.onrender.com/emails/${id}` , {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
  .catch(error => console.log('Error', error))
}


// reply to user
function reply(id) {

  fetch(`https://django-js-mail.onrender.com/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    // call the compose email
    compose_email()

    document.querySelector('#compose-view').querySelector('h3').innerHTML = 'Reply';

    document.querySelector('#compose-recipients').value = email.sender;

    // add Re: if it the mail subject doesn't start that way
    if (!email.subject.startsWith('Re:')) {
      document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
    } else {
      document.querySelector('#compose-subject').value = email.subject;
    }


    document.querySelector('#compose-body').value = `\n\n\n---------------\nOn ${email.timestamp} ${email.sender} wrote: \n${email.body}`;    

});
  
}

// archive and unarchive email
function archive(id, value) {
  fetch(`https://django-js-mail.onrender.com/emails/${id}`, {
    method: 'PUT', 
    body: JSON.stringify({

      archived: !value
    })
  })

  // load to inbox page
  location.reload();

}

// display error
function error(message) {
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#emails-view').innerHTML = `<h3>${message}</h3>`;
  document.querySelector('#detail-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

}

// make sure there an subject given to email else return no Subject
function send_subject(emailSubject) {

      if (emailSubject.trim().length <= 0 ) {

        return "(no subject)";
        } else if ( emailSubject.startsWith('Re:')) {

          second = emailSubject.split(':', 2)[1];
          // this is for email subjects like "Re: "
          if (second.trim().length <= 0 ) {
            return "(no subject)";
          }
          // return with for example "RE: Hello"
         return ` ${emailSubject}`;

         // no issues
        } else {
        return emailSubject;
      }
}


function getSvg() {
  return '<svg class="svg-icon" style="vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M512.056 908.647c-84.516 0-166.416-27.084-235.266-78.637-84.15-63.028-138.741-155.109-153.675-259.2-14.934-104.119 11.559-207.816 74.588-291.994 130.162-173.812 377.438-209.25 551.194-79.172 72.844 54.562 124.819 133.228 146.391 221.484 3.684 15.103-5.569 30.319-20.644 34.003-15.075 3.572-30.319-5.541-34.003-20.644-18.45-75.628-63-143.044-125.466-189.816-148.866-111.516-360.844-81.112-472.444 67.866-54.028 72.141-76.725 161.016-63.9 250.256 12.797 89.241 59.597 168.131 131.737 222.131 149.006 111.656 360.956 81.197 472.5-67.781 29.194-39.009 49.219-82.716 59.456-129.938 3.319-15.188 18.366-24.834 33.441-21.544 15.188 3.291 24.834 18.281 21.544 33.441-12.009 55.181-35.353 106.2-69.413 151.762-63.028 84.15-155.109 138.769-259.256 153.675-18.984 2.756-37.941 4.106-56.784 4.106z"  /></svg>'  
}