// pb_hooks/match.pb.js
// Recompute a (room, name) match row whenever a vote changes, or whenever
// room membership changes (which shifts the threshold for a star).
//
// VERSION NOTE: the JSVM hook API (onRecordAfter*Success, $app.dao(), Record)
// differs across PocketBase releases. This targets 0.22.x. Pin PB_VERSION in
// the Dockerfile and verify against that release's jsvm reference.

function recomputeMatch(roomId, nameId) {
  const memberCount = $app.dao().findRecordsByFilter(
    "members", `room = "${roomId}"`
  ).length;

  const likes = $app.dao().findRecordsByFilter(
    "votes", `room = "${roomId}" && name = "${nameId}" && liked = true`
  ).length;

  const isStar = memberCount > 0 && likes === memberCount;

  let rec;
  try {
    rec = $app.dao().findFirstRecordByFilter(
      "matches", `room = "${roomId}" && name = "${nameId}"`
    );
  } catch (_) {
    const col = $app.dao().findCollectionByNameOrId("matches");
    rec = new Record(col, { room: roomId, name: nameId });
  }
  rec.set("like_count", likes);
  rec.set("is_star", isStar);
  $app.dao().saveRecord(rec);
}

// Recompute every match row in a room (used when membership changes).
function recomputeRoom(roomId) {
  const votedNames = $app.dao().findRecordsByFilter(
    "votes", `room = "${roomId}"`
  );
  const seen = {};
  votedNames.forEach((v) => {
    const nid = v.get("name");
    if (!seen[nid]) { seen[nid] = true; recomputeMatch(roomId, nid); }
  });
}

onRecordAfterCreateSuccess((e) => {
  recomputeMatch(e.record.get("room"), e.record.get("name"));
  e.next();
}, "votes");

onRecordAfterUpdateSuccess((e) => {
  recomputeMatch(e.record.get("room"), e.record.get("name"));
  e.next();
}, "votes");

onRecordAfterCreateSuccess((e) => {
  recomputeRoom(e.record.get("room"));
  e.next();
}, "members");

onRecordAfterDeleteSuccess((e) => {
  recomputeRoom(e.record.get("room"));
  e.next();
}, "members");
