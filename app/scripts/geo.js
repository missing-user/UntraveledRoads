const geoFirestore = new GeoFirestore(firestore);
const geoCollectionRef = geoFirestore.collection('locations');
var geocoder;

function initMap() {
  geocoder = new google.maps.Geocoder();
}

function subscribeGeoquery(location, radius) {
  const query = geoCollectionRef.near({
    center: new firebase.firestore.GeoPoint(location.lat, location.lng),
    radius: radius,
  });

  console.log('New query (subscription?) created');
  subscription = query.onSnapshot((snapshot) => {
    console.log(snapshot.docChanges())
    snapshot.docChanges().forEach((change) => {
      switch (change.type) {
        case 'added':
          console.log('Snapshot detected added marker');
          return change.doc.data();
        case 'modified':
          console.log('Snapshot detected modified marker');
          return change.doc.data();
        case 'removed':
          console.log('Snapshot detected removed marker');
          return change.doc.data(); //change.doc.id
        default:
          break;
      }
    });
  });
}

function setInGeofire(location, datain) {
  const hash = geokit.Geokit.hash(location);
console.log(hash);
  geoCollectionRef.doc(hash).get().then((snapshot) => {
    let data = snapshot.data();
    if (!data) {
      data = {
        datain,
        coordinates: new firebase.firestore.GeoPoint(location.lat, location.lng)
      };
      console.log('Provided key is not in Firestore, adding document: ', JSON.stringify(data));
      createInGeofirestore(hash, data);
    } else {
      console.log('Provided key is in Firestore, updating document: ', JSON.stringify(data));
      updateInGeofirestore(hash, data);
    }
  }, (error) => {
    console.log('Error: ' + error);
  });
}

function updateInGeofirestore(key, data) {
  geoCollectionRef.doc(key).update(data).then(() => {
  console.log('Provided document has been added in Firestore');
}, (error) => {
  console.log('Error: ' + error);
});}

function createInGeofirestore(key, data) {
  geoCollectionRef.doc(key).set(data).then(() => {
    console.log('Provided document has been added in Firestore');
  }, (error) => {
    console.log('Error: ' + error);
  });
}

function addressToHash(address) {
  return new Promise(function(resolve, reject){
    geocoder.geocode({
      'address': address
    }, function(results, status) {
      if (status == 'OK') {
        const hash = geokit.Geokit.hash({lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng()});
        resolve(hash);
      } else {
        alert('Geocode was not successful for the following reason: ' + status);
        reject(status);
      }
    });
  });
}

function addressToPoint(address) {
  return new Promise(function(resolve, reject){
    geocoder.geocode({
      'address': address
    }, function(results, status) {
      if (status == 'OK') {
        resolve({lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng()});
      } else {
        alert('Geocode was not successful for the following reason: ' + status);
        reject(status);
      }
    });
  });
}
//subscribeGeoquery(ql, 20);
setInterval(getUserPos(), 60*1000);

function getUserPos() {
  if (navigator.geolocation) {
    let giveUp = 1000 * 30; //30 seconds
    let tooOld = 1000 * 60 * 15; //one hour
    options = {
      enableHighAccuracy: true,
      timeout: giveUp,
      maximumAge: tooOld
    }

    navigator.geolocation.getCurrentPosition(gotPos, posFail, options);
  } else {
    alert('you have to enable geolocation for this app to work');
    console.error('you have to enable eolocation for this app to work');
  }
}

var cUserPos;

function gotPos(position) {
  cUserPos = position;
  console.log('lat: ' + cUserPos.coords.latitude + ' long: ' + cUserPos.coords.longitude);
}

function posFail(err) {
  //err is a number
  let errors = {
    1: 'No permission',
    2: 'Unable to determine',
    3: 'Took too long'
  }
  console.error(errors[err]);
}
