
const geoFirestore = new GeoFirestore(firestore);
const geoCollectionRef = geoFirestore.collection('viewers');

const query  = geocollection.near({ center: new firebase.firestore.GeoPoint(40.7589, -73.9851), radius: 1000 });

// Get query (as Promise)
query.get().then((value) => {
  console.log(value.docs); // All docs returned by GeoQuery
});

function queryFirestore(location, radius) {
  const query = geoCollectionRef.near({
    center: new firebase.firestore.GeoPoint(location.lat, location.lng),
    radius
  });

  console.log('New query (subscription?) created');
  subscription = query.onSnapshot((snapshot) => {
    console.log(snapshot.docChanges())
    snapshot.docChanges().forEach((change) => {
      switch (change.type) {
        case 'added':
          console.log('Snapshot detected added marker');
          return addMarker(change.doc.id, change.doc.data());
        case 'modified':
          console.log('Snapshot detected modified marker');
          return updateMarker(change.doc.id, change.doc.data());
        case 'removed':
          console.log('Snapshot detected removed marker');
          return removeMarker(change.doc.id, change.doc.data());
        default:
          break;
      }
    });
  });
}
/*const geocollection: GeoCollectionReference = geofirestore.collection('restaurants');
const query: GeoQuery = geocollection.near({center: firebase.firestore.GeoPoint(40.7589, -73.9851), radius: 10});
query.get().then((value: GeoQuerySnapshot) => {
  console.log(value.docs);
});

window.onload = function() {
  var startPos;
  var geoSuccess = function(position) {
    startPos = position;
    document.getElementById('startLat').innerHTML = startPos.coords.latitude;
    document.getElementById('startLon').innerHTML = startPos.coords.longitude;
  };
  console.log(navigator.geolocation.getCurrentPosition(geoSuccess));
};*/
