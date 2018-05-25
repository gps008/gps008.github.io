var messaging = firebase.messaging();

navigator.serviceWorker.register('https://gps008.github.io/firebase-messaging-sw.js')
  .then((registration) => {
    messaging.useServiceWorker(registration);

    // Request permission and get token.....
  });


messaging.usePublicVapidKey('BDlzGLqxvH9HBh8wD_JWf1joOgLUudKB-XOUDs3A0RywUs_QwvvI0iNeF1uesQjh5dHtv2lIibXtBwFvVdFf-C0');
// [END set_public_vapid_key]
// IDs of divs that display Instance ID token UI or request permission UI.


// [START refresh_token]
// Callback fired if Instance ID token is updated.
messaging.onTokenRefresh(function () {
  messaging.getToken().then(function (refreshedToken) {
    console.log('Token refreshed.');
    // Indicate that the new Instance ID token has not yet been sent to the
    // app server.
    setTokenSentToServer(false);
    // Send Instance ID token to app server.
    sendTokenToServer(refreshedToken);
    // [START_EXCLUDE]
    // Display new Instance ID token and clear UI of all previous messages.
    resetUI();
    // [END_EXCLUDE]
  }).catch(function (err) {
    console.log('Unable to retrieve refreshed token ', err);
    showToken('Unable to retrieve refreshed token ', err);
  });
});
// [END refresh_token]


// [START receive_message]
// Handle incoming messages. Called when:
// - a message is received while the app has focus
// - the user clicks on an app notification created by a service worker
//   `messaging.setBackgroundMessageHandler` handler.
messaging.onMessage(function (payload) {
  console.log('Message received. ', payload);
  // [START_EXCLUDE]
  // Update the UI to include the received message.
  //appendMessage(payload);

  notyfy({
    force: true,
    text: 'MESSAGE RECEIVED !! see console',
    type: 'success',
    layout: 'top',
    speed: 400,
    timeout: 5000
  });

  // [END_EXCLUDE]
});


// [END receive_message]
function resetUI() {
  // [START get_token]
  // Get Instance ID token. Initially this makes a network call, once retrieved
  // subsequent calls to getToken will return from cache.
  messaging.getToken().then(function (currentToken) {
    if (currentToken) {
      sendTokenToServer(currentToken);
    } else {
      // Show permission request.
      console.log('No Instance ID token available. Request permission to generate one.');
      setTokenSentToServer(false);
    }
  }).catch(function (err) {
    console.log('An error occurred while retrieving token. ', err);
    showToken('Error retrieving Instance ID token. ', err);
    setTokenSentToServer(false);
  });
}


// [END get_token]
function showToken(currentToken) {
  // Show token in console and UI.
  notyfy({
    force: true,
    text: currentToken,
    type: 'success',
    layout: 'top',
    speed: 400,
    timeout: 10000
  });
}


// Send the Instance ID token your application server, so that it can:
// - send messages back to this app
// - subscribe/unsubscribe the token from topics
function sendTokenToServer(currentToken) {
  if (!isTokenSentToServer()) {
    console.log('Sending token to server...');


    //Send the current token to your server.
    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function () {
      if (httpRequest.readyState === XMLHttpRequest.DONE) {
        if (httpRequest.status === 201) {
          setTokenSentToServer(true, currentToken);
        } else {
          // TODO: Implement this !
          console.log('An error occured during when sending token to server');
          console.log(httpRequest);
        }
      } else {
        //console.log('Error during when sending token to server');
      }
    };

    let oldToken = null;
    if (window.localStorage.hasOwnProperty('__token')) {
      oldToken = window.localStorage.getItem('__token');
    }

    httpRequest.open('POST', '/api/v1/push/subscribe', true);
    httpRequest.setRequestHeader('Content-Type', 'application/json');
    httpRequest.send(JSON.stringify({
      iid_token: currentToken,
      old_iid_token: oldToken,
      client: 'web'
    }));
  } else {
    console.log('Token already sent to server so won\'t send it again ' +
      'unless it changes');
  }
}


function isTokenSentToServer() {
  return window.localStorage.getItem('sentToServer') === '1';
}


function setTokenSentToServer(sent, token) {
  window.localStorage.setItem('sentToServer', sent ? 1 : 0);

  if (typeof token !== 'undefined') {
    window.localStorage.setItem('__token', token);
  } else {
    window.localStorage.removeItem('__token');
  }
}


function showHideDiv(divId, show) {
  const div = document.querySelector('#' + divId);
  if (show) {
    div.style = 'display: visible';
  } else {
    div.style = 'display: none';
  }
}
function requestPermission() {
  console.log('Requesting permission...');
  // [START request_permission]
  messaging.requestPermission().then(function () {
    console.log('Notification permission granted.');
    // TODO(developer): Retrieve an Instance ID token for use with FCM.
    // [START_EXCLUDE]
    // In many cases once an app has been granted notification permission, it
    // should update its UI reflecting this.
    resetUI();
    // [END_EXCLUDE]
  }).catch(function (err) {
    console.log('Unable to get permission to notify.', err);
  });
  // [END request_permission]
}
function deleteToken() {
  // Delete Instance ID token.
  // TODO: use messaging.deleteToken() (not working now)
  // [START delete_token]
  // messaging.getToken().then(function(currentToken) {
  //   messaging.deleteToken(currentToken).then(function() {
  // [START_EXCLUDE]


  if (window.localStorage.hasOwnProperty('__token')) {
    let currentToken = window.localStorage.getItem('__token');

    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function () {
      if (httpRequest.readyState === XMLHttpRequest.DONE) {
        if (httpRequest.status === 201) {
          console.log('Token deleted.');
          setTokenSentToServer(false);
        } else {
          // TODO: Implement this !
          console.log('An error occured during when sending token to server');
        }
      } else {
        console.log('Error during when sending token to server');
      }
    };

    httpRequest.open('POST', '/api/v1/push/unsubscribe', true);
    httpRequest.setRequestHeader('Content-Type', 'application/json');
    httpRequest.send(JSON.stringify({
      iid_token: currentToken,
      client: 'web'
    }));
  } else {
    console.error('Identification Token not found');
  }

  // TODO: Once token is deleted update UI.
  // resetUI();

  // [END_EXCLUDE]

  //   }).catch(function(err) {
  //     console.log('Unable to delete token. ', err);
  //   });
  //   // [END delete_token]
  // }).catch(function(err) {
  //   console.log('Error retrieving Instance ID token. ', err);
  //   showToken('Error retrieving Instance ID token. ', err);
  // });

}
// Add a message to the messages element.
function appendMessage(payload) {
  const messagesElement = document.querySelector('#messages');
  const dataHeaderELement = document.createElement('h5');
  const dataElement = document.createElement('pre');
  dataElement.style = 'overflow-x:hidden;';
  dataHeaderELement.textContent = 'Received message:';
  dataElement.textContent = JSON.stringify(payload, null, 2);
  messagesElement.appendChild(dataHeaderELement);
  messagesElement.appendChild(dataElement);
}
// Clear the messages element of all children.
function clearMessages() {
  const messagesElement = document.querySelector('#messages');
  while (messagesElement.hasChildNodes()) {
    messagesElement.removeChild(messagesElement.lastChild);
  }
}
function updateUIForPushEnabled(currentToken) {
  showHideDiv(tokenDivId, true);
  showHideDiv(permissionDivId, false);
  showToken(currentToken);
}
function updateUIForPushPermissionRequired() {
  showHideDiv(tokenDivId, false);
  showHideDiv(permissionDivId, true);
}