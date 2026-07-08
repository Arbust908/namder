// pb_hooks/match.pb.js
// Recompute a (room, name) match row whenever a vote changes, or whenever
// room membership changes (which shifts the threshold for a star).
//
// TARGET: PocketBase v0.39.x — $app available in pb_hooks, methods are direct (no .dao()).

function recomputeMatch(roomId, nameId) {
  const memberCount = $app.findRecordsByFilter(
    "members", `room = "${roomId}"`
  ).length;

  const likes = $app.findRecordsByFilter(
    "votes", `room = "${roomId}" && name = "${nameId}" && liked = true`
  ).length;

  const isStar = memberCount > 0 && likes === memberCount;

  let rec;
  try {
    rec = $app.findFirstRecordByFilter(
      "matches", `room = "${roomId}" && name = "${nameId}"`
    );
  } catch (_) {
    const col = $app.findCollectionByNameOrId("matches");
    rec = new Record(col);
    rec.load({ room: roomId, name: nameId });
  }
  rec.set("like_count", likes);
  rec.set("is_star", isStar);
  $app.save(rec);
}

// Recompute every match row in a room (used when membership changes).
function recomputeRoom(roomId) {
  const votedNames = $app.findRecordsByFilter(
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
}, "votes");

onRecordAfterUpdateSuccess((e) => {
  recomputeMatch(e.record.get("room"), e.record.get("name"));
}, "votes");

onRecordAfterCreateSuccess((e) => {
  recomputeRoom(e.record.get("room"));
}, "members");

onRecordAfterDeleteSuccess((e) => {
  recomputeRoom(e.record.get("room"));
}, "members");
