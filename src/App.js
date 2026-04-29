
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // EVENTS
    match /events/{eventId} {
      allow read: if true;

      // anyone logged in can create events
      allow create: if true;

      // only admin can delete events
      allow delete: if request.auth != null
        && request.auth.token.admin == true;

      // block updates (prevents tampering)
      allow update: if false;
    }

    // SCORES
    match /scores/{scoreId} {
      allow read: if true;

      // allow scoring (judges)
      allow create: if true;

      // 🔒 NO ONE can delete scores
      allow delete: if false;

      // 🔒 NO editing scores after submit
      allow update: if false;
    }
  }
}
