#!/usr/bin/env python3
"""Generate the Rally Provo ERD as an SVG, laid out to match the live database."""

W, H = 1780, 1200
BOX_W, HDR_H, ROW_H = 258, 36, 23
INK, LINE, HDR = "#1b2434", "#8a93a6", "#243css"
HDR = "#243b55"
NEW = "#0f6b4f"          # header colour for the three added entities
PK_C, FK_C = "#b4531a", "#2f6ea8"

# name: (x, y, is_new, [(marker, attribute), ...])
E = {
    "Profile": (690, 470, False, [
        ("PK", "ProfileID"), ("", "Name"), ("", "Bio"), ("", "Birthday"),
        ("", "HomePhone"), ("", "CellPhone"), ("", "WorkPhone"), ("", "ReportingCounter")]),
    "Photo": (1090, 90, False, [
        ("PK", "PhotoID"), ("FK", "UserID"), ("", "DisplayOrderID"), ("", "PhotoFile")]),
    "Reporting": (1440, 90, False, [
        ("PK", "ReportingID"), ("FK", "Reporter"), ("FK", "ReportedOn"),
        ("", "ReportedAt"), ("", "Why")]),
    "Choice": (1090, 470, False, [
        ("PK", "ChoiceID"), ("FK", "Swiper"), ("FK", "SwipedOn"), ("", "Yes"), ("", "No")]),
    "Messages": (1440, 470, False, [
        ("PK", "MessageID"), ("FK", "ChoiceID"), ("FK", "SenderID"),
        ("FK", "ReceiverID"), ("", "Message"), ("", "SentAt")]),
    "Profile-Interest": (340, 470, False, [
        ("PK", "PIID"), ("FK", "UserID"), ("FK", "InterestID"),
        ("", "SkillLevel"), ("", "StartDate"), ("", "EndDate")]),
    "Interests": (20, 470, False, [
        ("PK", "InterestID"), ("", "InterestName"), ("", "Icon"), ("", "Community")]),
    "Venue-Interest": (20, 900, True, [
        ("PK", "VenueInterestID"), ("FK", "VenueID"), ("FK", "InterestID")]),
    "Venue": (340, 900, True, [
        ("PK", "VenueID"), ("", "VenueName"), ("", "Setting"), ("", "CourtCount"),
        ("", "Unit"), ("", "MilesAway"), ("", "BusyNote")]),
    "Event": (690, 900, True, [
        ("PK", "EventID"), ("FK", "HostID"), ("FK", "InterestID"), ("FK", "VenueID"),
        ("", "EventDate"), ("", "EventTime"), ("", "Note"),
        ("", "NewPeopleMet"), ("", "CreatedAt")]),
    "EventAttendee": (1140, 900, True, [
        ("PK", "EventAttendeeID"), ("FK", "EventID"), ("FK", "ProfileID"), ("", "Status")]),
}

def h(n):
    return HDR_H + len(E[n][3]) * ROW_H

def anchor(n, side, f=0.5):
    x, y = E[n][0], E[n][1]
    bh = h(n)
    if side == "l": return (x, y + bh * f)
    if side == "r": return (x + BOX_W, y + bh * f)
    if side == "t": return (x + BOX_W * f, y)
    return (x + BOX_W * f, y + bh)

# (from, from_side, from_frac, to, to_side, to_frac, label, one_end)
# one_end: which end carries the "1" tick; the other gets a crow's foot.
R = [
    ("Profile", "t", .30, "Photo",        "l", .50, "has",            "from"),
    ("Profile", "t", .62, "Reporting",    "l", .30, "files",          "from"),
    ("Profile", "t", .80, "Reporting",    "l", .72, "is reported in", "from"),
    ("Profile", "r", .28, "Choice",       "l", .25, "swipes",         "from"),
    ("Profile", "r", .62, "Choice",       "l", .72, "is swiped on",   "from"),
    ("Choice",  "r", .50, "Messages",     "l", .50, "carries",        "from"),
    ("Profile", "b", .78, "Messages",     "b", .50, "sends / receives", "from"),
    ("Profile", "l", .45, "Profile-Interest", "r", .45, "",           "from"),
    ("Interests", "r", .45, "Profile-Interest", "l", .45, "",         "from"),
    ("Interests", "b", .22, "Venue-Interest", "t", .35, "",           "from"),
    ("Venue",   "l", .30, "Venue-Interest", "r", .30, "",             "from"),
    ("Venue",   "r", .35, "Event",        "l", .72, "hosts",          "from"),
    ("Interests", "b", .90, "Event",      "t", .12, "is the sport of", "from"),
    ("Profile", "b", .30, "Event",        "t", .30, "organizes",      "from"),
    ("Event",   "r", .50, "EventAttendee", "l", .62, "",              "from"),
    ("Profile", "b", .55, "EventAttendee", "t", .55, "",              "from"),
]

out = []
A = out.append
A(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="Helvetica, Arial, sans-serif">')
A(f'<rect width="{W}" height="{H}" fill="#ffffff"/>')

A('<text x="30" y="46" font-size="29" font-weight="700" fill="#1b2434">Rally Provo — Entity Relationship Diagram</text>')
A('<text x="30" y="72" font-size="15" fill="#5b6478">Eleven entities. Green headers mark the three entities added so a booked game has somewhere to live.</text>')

def elbow(p, q, fs, ts):
    """Orthogonal route from p (leaving on side fs) to q (entering on side ts)."""
    (x1, y1), (x2, y2) = p, q
    horiz_out = fs in "lr"
    horiz_in = ts in "lr"
    if horiz_out and horiz_in:
        mx = (x1 + x2) / 2
        return [(x1, y1), (mx, y1), (mx, y2), (x2, y2)]
    if not horiz_out and not horiz_in:
        my = (y1 + y2) / 2
        return [(x1, y1), (x1, my), (x2, my), (x2, y2)]
    if horiz_out:
        return [(x1, y1), (x2, y1), (x2, y2)]
    return [(x1, y1), (x1, y2), (x2, y2)]

def foot(pt, prev, many=True):
    """Crow's foot (many) or single tick (one) at pt, oriented from prev."""
    x, y = pt
    dx, dy = x - prev[0], y - prev[1]
    if abs(dx) >= abs(dy):
        s = 1 if dx > 0 else -1
        if many:
            # prongs converge away from the entity and fan out against its edge
            return (f'<path d="M{x-s*13},{y} L{x},{y-8} M{x-s*13},{y} L{x},{y} '
                    f'M{x-s*13},{y} L{x},{y+8}" stroke="{LINE}" stroke-width="1.6" fill="none"/>')
        return f'<path d="M{x-s*11},{y-8} L{x-s*11},{y+8}" stroke="{LINE}" stroke-width="1.8"/>'
    s = 1 if dy > 0 else -1
    if many:
        return (f'<path d="M{x},{y-s*13} L{x-8},{y} M{x},{y-s*13} L{x},{y} '
                f'M{x},{y-s*13} L{x+8},{y}" stroke="{LINE}" stroke-width="1.6" fill="none"/>')
    return f'<path d="M{x-8},{y-s*11} L{x+8},{y-s*11}" stroke="{LINE}" stroke-width="1.8"/>'

# ---- relationships (drawn first so boxes sit on top) ----
for fn, fs, ff, tn, ts, tf, label, one in R:
    p, q = anchor(fn, fs, ff), anchor(tn, ts, tf)
    pts = elbow(p, q, fs, ts)
    d = "M" + " L".join(f"{x:.0f},{y:.0f}" for x, y in pts)
    A(f'<path d="{d}" stroke="{LINE}" stroke-width="1.6" fill="none"/>')
    A(foot(pts[0], pts[1], many=(one != "from")))
    A(foot(pts[-1], pts[-2], many=(one == "from")))
    # cardinality text at each end
    A(f'<text x="{pts[0][0]+(18 if fs=="r" else -18 if fs=="l" else 11):.0f}" '
      f'y="{pts[0][1]+(-9 if fs in "lr" else (18 if fs=="b" else -9)):.0f}" font-size="14" '
      f'font-weight="700" fill="#4a5costume">1</text>'.replace("4a5costume", "46506a"))
    # the N sits outside the entity it points at, or the box would cover it
    A(f'<text x="{pts[-1][0]+(-26 if ts=="l" else 20 if ts=="r" else 11):.0f}" '
      f'y="{pts[-1][1]+(-9 if ts in "lr" else (22 if ts=="b" else -12)):.0f}" font-size="14" '
      f'font-weight="700" fill="#46506a">N</text>')
    if label:
        # sit the label on the longest leg, so it never lands on top of an entity
        segs = [(abs(b[0]-a[0]) + abs(b[1]-a[1]), a, b) for a, b in zip(pts, pts[1:])]
        _, a, b = max(segs)
        mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
        A(f'<rect x="{mx-len(label)*3.9-6:.0f}" y="{my-19:.0f}" width="{len(label)*7.8+12:.0f}" '
          f'height="17" rx="3" fill="#ffffff" opacity="0.95"/>')
        A(f'<text x="{mx:.0f}" y="{my-6:.0f}" font-size="12.5" fill="#5b6478" '
          f'text-anchor="middle">{label}</text>')

# ---- entity boxes ----
for name, (x, y, is_new, attrs) in E.items():
    bh = h(name)
    hc = NEW if is_new else HDR
    A(f'<rect x="{x}" y="{y}" width="{BOX_W}" height="{bh}" rx="7" fill="#ffffff" '
      f'stroke="{hc}" stroke-width="1.8"/>')
    A(f'<path d="M{x},{y+HDR_H} L{x},{y+7} Q{x},{y} {x+7},{y} L{x+BOX_W-7},{y} '
      f'Q{x+BOX_W},{y} {x+BOX_W},{y+7} L{x+BOX_W},{y+HDR_H} Z" fill="{hc}"/>')
    A(f'<text x="{x+BOX_W/2}" y="{y+24}" font-size="15.5" font-weight="700" fill="#ffffff" '
      f'text-anchor="middle">{name}</text>')
    for i, (mk, at) in enumerate(attrs):
        ry = y + HDR_H + i * ROW_H
        if i % 2 == 1:
            A(f'<rect x="{x+1.5}" y="{ry}" width="{BOX_W-3}" height="{ROW_H}" fill="#f6f7fa"/>')
        if mk:
            A(f'<text x="{x+11}" y="{ry+16}" font-size="11" font-weight="700" '
              f'fill="{PK_C if mk=="PK" else FK_C}">{mk}</text>')
        bold = ' font-weight="700"' if mk == "PK" else ''
        deco = ' text-decoration="underline"' if mk == "PK" else ''
        A(f'<text x="{x+42}" y="{ry+16}" font-size="13"{bold}{deco} fill="{INK}">{at}</text>')
    A(f'<line x1="{x+34}" y1="{y+HDR_H}" x2="{x+34}" y2="{y+bh}" stroke="#e2e5ec" stroke-width="1"/>')

# ---- legend ----
lx, ly = 30, 115
A(f'<rect x="{lx}" y="{ly}" width="420" height="118" rx="7" fill="#fbfcfd" stroke="#d8dce5"/>')
A(f'<text x="{lx+16}" y="{ly+25}" font-size="13.5" font-weight="700" fill="{INK}">Legend</text>')
A(f'<text x="{lx+16}" y="{ly+48}" font-size="12.5" fill="{PK_C}" font-weight="700">PK</text>')
A(f'<text x="{lx+46}" y="{ly+48}" font-size="12.5" fill="#46506a">primary key (underlined)</text>')
A(f'<text x="{lx+16}" y="{ly+69}" font-size="12.5" fill="{FK_C}" font-weight="700">FK</text>')
A(f'<text x="{lx+46}" y="{ly+69}" font-size="12.5" fill="#46506a">foreign key</text>')
A(f'<path d="M{lx+18},{ly+88} L{lx+40},{ly+88}" stroke="{LINE}" stroke-width="1.8"/>')
A(f'<path d="M{lx+18},{ly+81} L{lx+18},{ly+95}" stroke="{LINE}" stroke-width="1.8"/>')
A(f'<path d="M{lx+40},{ly+88} L{lx+28},{ly+81} M{lx+40},{ly+88} L{lx+28},{ly+88} '
  f'M{lx+40},{ly+88} L{lx+28},{ly+95}" stroke="{LINE}" stroke-width="1.6" fill="none"/>')
A(f'<text x="{lx+52}" y="{ly+92}" font-size="12.5" fill="#46506a">'
  f'one-to-many (1 → N). Two junction tables give many-to-many.</text>')

A('</svg>')

open("/Users/jordanharris/provo-pickup/docs/erd.svg", "w").write("\n".join(out))
print("svg written")
