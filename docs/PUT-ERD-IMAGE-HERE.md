# ERD image

The README embeds `docs/erd.png`. Export the diagram from Lucidchart / draw.io
as a PNG, name it exactly `erd.png`, and drop it in this folder.

Before exporting, make sure the diagram includes the three entities that were
added so the calendar "book event" feature has somewhere to write:

- **Venue** — VenueID (PK), VenueName, Setting, CourtCount, Unit, MilesAway, BusyNote
- **Event** — EventID (PK), HostID (FK→Profile), InterestID (FK→Interests),
  VenueID (FK→Venue), EventDate, EventTime, Note, NewPeopleMet, CreatedAt
- **EventAttendee** — EventAttendeeID (PK), EventID (FK→Event), ProfileID (FK→Profile), Status

Plus two small edits to existing boxes:

- **Venue-Interest** — a junction between Venue and Interests (which sports a court supports)
- **Messages** — add a `SentAt` attribute

Relationships to label:

- Profile → Event (one-to-many, as host)
- Interests → Event (one-to-many)
- Venue → Event (one-to-many)
- Profile ↔ Event through EventAttendee (many-to-many)
- Venue ↔ Interests through Venue-Interest (many-to-many)

Delete this file once `erd.png` is in place.
