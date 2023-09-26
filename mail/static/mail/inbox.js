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
      fetch('/emails', {
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
        document.querySelector('#emails-view').append(div);

      })
      
      .catch(error => {
        console.log("Error", error);
        return location.reload();
      })

      return false;
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
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    
    // show the error
    if (emails.error) {
      error(emails.error);

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

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
}

// View Email in detail
function load_detail(email_id, mailbox) {

  // ask for the data
  fetch(`emails/${email_id}`)
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
  fetch( `/emails/${id}` , {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
  .catch(error => console.log('Error', error))
}


// reply to user
function reply(id) {
  fetch(`/emails/${id}`)
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
  fetch(`/emails/${id}`, {
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