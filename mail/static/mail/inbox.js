document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  

   

});


// Send Mail
function compose_email() {

    // Compose email
    document.querySelector('#compose-form').onsubmit = function() {

      fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
          recipients: document.querySelector('#compose-recipients').value,
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value,
        })
      })
      .then(response => response.json())
      .then(result => {
        // send the user to sent page/ portion (its like redirecting a user)
        load_mailbox('sent')
        // Show the user response for their composed email success or error
        const par = document.createElement('p');
        par.innerHTML = result.message
        document.querySelector('#emails-view').append(par);
        console.log(result)
      })
  
      .catch(error => {
        console.log("Error", error);
      });
  
  
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
    for (let index = 0; index < emails.length; index++) {
      const div = document.createElement('div');
      div.className = 'border';
      if (mailbox === 'inbox') {
        div.innerHTML =  `<button class='archieve' data-id=${emails[index].id}>Archieve</button>`;
      } else {
        div.innerHTML =  emails[index].sender + emails[index].subject + emails[index].timestamp;
      }
      document.querySelector('#emails-view').append(div)
      // div.addEventListener('click', () => {
      //   load_detail(emails[index].id)
      // });
      document.querySelectorAll('.archieve').forEach(button => {
        button.onclick = function() {
          console.log(this.dataset.id);
        };
    });
    }
    console.log(mailbox, emails)
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
function load_detail(email_id) {

  fetch(`emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    const element = document.createElement('div');
    element.innerHTML =  `From: ${email.sender} \n To: ${email.recipients} \n Subject: ${email.subject} \n <button>Reply</button> \n ${email.body}`;

  document.querySelector('#detail-view').append(element);


  // Show the detail and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#detail-view').style.display = 'block';
      
    console.log(email)
  });
} 
