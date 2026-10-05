// Teams: display name, division, and two inks lifted for dark newsprint (main ink first).
// Black secondaries become paper white; dark navies are lightened.
export const TEAMS = {
  ANA: ["Anaheim", "Pacific", "#F47A38", "#B9975B"],
  BOS: ["Boston", "Atlantic", "#FFB81C", "#ECE9E1"],
  BUF: ["Buffalo", "Atlantic", "#3C7BE0", "#FFB81C"],
  CGY: ["Calgary", "Pacific", "#E8213A", "#FAAF19"],
  CAR: ["Carolina", "Metropolitan", "#E0261F", "#ECE9E1"],
  CHI: ["Chicago", "Central", "#E0102F", "#ECE9E1"],
  COL: ["Colorado", "Central", "#A23B5C", "#4A8BC9"],
  CBJ: ["Columbus", "Metropolitan", "#3A6FC4", "#CE1126"],
  DAL: ["Dallas", "Central", "#00A266", "#A7A8A9"],
  DET: ["Detroit", "Atlantic", "#E0102F", "#ECE9E1"],
  EDM: ["Edmonton", "Pacific", "#FF6A1F", "#3A6FC4"],
  FLA: ["Florida", "Atlantic", "#E0102F", "#C8A85C"],
  LAK: ["Los Angeles", "Pacific", "#A2AAAD", "#ECE9E1"],
  MIN: ["Minnesota", "Central", "#1E9C62", "#DDCBA4"],
  MTL: ["Montréal", "Atlantic", "#E0102F", "#4A63D0"],
  NSH: ["Nashville", "Central", "#FFB81C", "#3A5FA8"],
  NJD: ["New Jersey", "Metropolitan", "#E0102F", "#ECE9E1"],
  NYI: ["NY Islanders", "Metropolitan", "#2F7BD8", "#F47D30"],
  NYR: ["NY Rangers", "Metropolitan", "#3A66D9", "#E0102F"],
  OTT: ["Ottawa", "Atlantic", "#E0102F", "#C9A13A"],
  PHI: ["Philadelphia", "Metropolitan", "#FA5A14", "#ECE9E1"],
  PIT: ["Pittsburgh", "Metropolitan", "#FCB514", "#ECE9E1"],
  SJS: ["San Jose", "Pacific", "#00A3AD", "#E57200"],
  SEA: ["Seattle", "Pacific", "#99D9D9", "#E9072B"],
  STL: ["St. Louis", "Central", "#3A6FD6", "#FCB514"],
  TBL: ["Tampa Bay", "Atlantic", "#3A70DA", "#ECE9E1"],
  TOR: ["Toronto", "Atlantic", "#5B8FEF", "#ECE9E1"],
  UTA: ["Utah", "Central", "#6CACE3", "#ECE9E1"],
  VAN: ["Vancouver", "Pacific", "#3A68C8", "#00A85A"],
  VGK: ["Vegas", "Pacific", "#B4975A", "#A2AAAD"],
  WSH: ["Washington", "Metropolitan", "#E0102F", "#4A6FC0"],
  WPG: ["Winnipeg", "Central", "#4C8BD6", "#A2AAAD"],
};

export const DIVISIONS = ["Atlantic", "Metropolitan", "Central", "Pacific"];
export const teamName = (t) => TEAMS[t]?.[0] || t;
export const inks = (t) => (TEAMS[t] ? [TEAMS[t][2], TEAMS[t][3]] : ["#ECE9E1", "#A8A49A"]);
// The chip colour for a rival: its main ink.
export const chip = (t) => inks(t)[0];
