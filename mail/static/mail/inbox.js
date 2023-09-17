document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  
  // By default, load the inbox
  load_mailbox('inbox');
  
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



      if (emailSubject.length == 0 && emailBody.length === 0 && emailRecipients.length > 0 ) {
        
        const txt = "Send this message without a subject and text in the body?";

        // ask users if they want to send a message without subject and body
        if (confirm(txt) === false) {
          return false;
        }
      }
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
        // get an error and remove div which display error
        if (result.error) {   
          if (form.querySelector('#compose-message')) {
            form.querySelector('#compose-message').remove();
          }

          // create a new div which display the new error
          const div = document.createElement('div');
          div.id = 'compose-message';
          div.innerHTML = `${result.error} <button class='hide'>X</button>`;
          form.insertBefore(div, form.children[1])
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
        console.log("Error ", error);
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
  
}

// Mailbox
function load_mailbox(mailbox) {

  // check if the ${mailbox} is inbox, sent or archieve
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    
    // show the user inv
    if (emails.error) {
      error(emails.error);
    }
    emails.forEach(email => {

      const div = document.createElement('div');
      if ((email.read === true) && (mailbox === 'inbox')) {
        div.className = 'mailbox read'; 
      } else {
        div.className = 'mailbox';
      }
      const subject = send_subject(email.subject);
      if (mailbox === 'sent')  { 
        div.innerHTML =  `<div class='recipient'>To: ${email.recipients}</div> <div class='subject'>${subject}</div> <div class='time'>${email.timestamp}</div>`;
      } else {
        div.innerHTML =  `<div class='recipient'>From: ${email.sender}</div> <div class='subject'>${subject}</div> <div  class='time'>${email.timestamp}</div>`;
      }

      document.querySelector('#emails-view').append(div)

      div.addEventListener('click', () => {
        load_detail(email.id, mailbox)       
      });

    });
    
  
  })
 
  // Error checking    
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

// View Email
function load_detail(email_id, mailbox) {
  // ask for the data
  fetch(`emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
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

    // body of the page
    const body = email.body.replaceAll('\n', '<br>');

    const subject = send_subject(email.subject);
    let Archieve;

    if (email.archived == false) {
       Archieve = `<button id='archive' class='btn btn-primary'  data-id=${email.id}>Archive</button>`
    } else {
       Archieve = `<button id='archive' class='btn btn-primary'  data-id=${email.id}>Unarchive</button>`
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
                                <div><button id='reply' class='btn btn-primary' data-id='${email.id}'>Reply</button></div>
                                <div>${Archieve}</div>
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


    // wait for the user to click the reply, archieve button
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

function change_read(id) {
  fetch( `/emails/${id}` , {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
  .catch(error => console.log('Error', error))
}


function reply(id) {
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    compose_email()
    document.querySelector('#compose-view').querySelector('h3').innerHTML = 'Reply';

    document.querySelector('#compose-recipients').value = email.sender;

    if (!email.subject.startsWith('Re:')) {
      document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
    } else {
      document.querySelector('#compose-subject').value = email.subject;
    }
    // "On Jan 1 2020, 12:00 AM foo@example.com wrote:"

    document.querySelector('#compose-body').value = `\n\n\n---------------\nOn ${email.timestamp} ${email.sender} wrote: \n${email.body}`;    

});
  
}

function archive(id, value) {
  fetch(`/emails/${id}`, {
    method: 'PUT', 
    body: JSON.stringify({
      archived: !value
    })
  })

  location.reload();

}

function error(message) {
  document.querySelector('#emails-view').innerHTML = `<h3>${message}</h3>`;
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#detail-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

}

function send_subject(emailSubject) {

      if (emailSubject.trim().length <= 0 ) {
        console.log('more than zero character',emailSubject);
        return "<i>(no Subject)</i>";
        } else if ( emailSubject.startsWith('Re:')) {
          second = emailSubject.split(':', 2)[1];

          if (second.trim().length <= 0 ) {
            return "<i>(no Subject)</i>";
          }

         return ` ${emailSubject}`;
        } else {
        return emailSubject;
      }
}