// Static reference data only — no generated matches, no fake teams.
// All match/standings data comes from the live API.

export const STAGE_LABELS = {
  GROUP_STAGE: 'Skupinová fáze',
  LAST_32: 'Kolo 32',
  LAST_16: 'Osmifinále',
  QUARTER_FINALS: 'Čtvrtfinále',
  SEMI_FINALS: 'Semifinále',
  THIRD_PLACE: 'O 3. místo',
  FINAL: 'Finále',
  // football-data.org uses these variants too
  ROUND_OF_32: 'Kolo 32',
  ROUND_OF_16: 'Osmifinále',
  QUARTER_FINAL: 'Čtvrtfinále',
  SEMI_FINAL: 'Semifinále',
}

// Map from football-data.org TLA → flagcdn.com country code
export const FLAG_MAP = {
  ARG: 'ar', BRA: 'br', FRA: 'fr', ENG: 'gb-eng', ESP: 'es',
  GER: 'de', POR: 'pt', NED: 'nl', BEL: 'be', ITA: 'it',
  CRO: 'hr', DEN: 'dk', SUI: 'ch', URU: 'uy', COL: 'co',
  MEX: 'mx', USA: 'us', CAN: 'ca', SEN: 'sn', MAR: 'ma',
  NGA: 'ng', CMR: 'cm', GHA: 'gh', EGY: 'eg', TUN: 'tn',
  CIV: 'ci', ALG: 'dz', ZIM: 'zw', MLI: 'ml', ANG: 'ao',
  JPN: 'jp', KOR: 'kr', AUS: 'au', IRN: 'ir', KSA: 'sa',
  QAT: 'qa', IRQ: 'iq', JOR: 'jo', CHN: 'cn', UZB: 'uz',
  IDN: 'id', THA: 'th', IND: 'in',
  PAN: 'pa', CRC: 'cr', HND: 'hn', JAM: 'jm', TTO: 'tt',
  SLV: 'sv', GUA: 'gt', CUB: 'cu', HAI: 'ht',
  PAR: 'py', ECU: 'ec', VEN: 've', PER: 'pe', CHI: 'cl',
  BOL: 'bo',
  SCO: 'gb-sct', WAL: 'gb-wls', NIR: 'gb-nir',
  POL: 'pl', ROU: 'ro', SVK: 'sk', CZE: 'cz', HUN: 'hu',
  GRE: 'gr', TUR: 'tr', UKR: 'ua', SRB: 'rs', AUT: 'at',
  ALB: 'al', ISL: 'is', NOR: 'no', SWE: 'se', FIN: 'fi',
  NZL: 'nz', SLO: 'si', MKD: 'mk', MNE: 'me', BIH: 'ba',
  RSA: 'za', ZAM: 'zm', TAN: 'tz', MOZ: 'mz', BFA: 'bf',
}

export function getFlagUrl(tla) {
  const code = FLAG_MAP[tla] || tla?.toLowerCase()
  return `https://flagcdn.com/w40/${code}.png`
}

// Known squad data used for first-goalscorer market (keyed by TLA)
export const TEAM_PLAYERS = {
  ARG: ['L. Messi', 'J. Álvarez', 'L. Martínez', 'Á. Di María', 'R. De Paul'],
  BRA: ['Vinícius Jr.', 'Rodrygo', 'Raphinha', 'Endrick', 'Bruno Guimarães'],
  FRA: ['K. Mbappé', 'A. Griezmann', 'O. Giroud', 'T. Hernandez', 'E. Camavinga'],
  ENG: ['H. Kane', 'B. Saka', 'J. Bellingham', 'P. Foden', 'T. Alexander-Arnold'],
  ESP: ['Y. Yamal', 'N. Williams', 'Ferran Torres', 'Morata', 'Pedri'],
  GER: ['K. Havertz', 'J. Musiala', 'L. Wirtz', 'T. Müller', 'I. Gündogan'],
  POR: ['C. Ronaldo', 'B. Fernandes', 'R. Leão', 'J. Félix', 'Vitinha'],
  NED: ['V. van Dijk', 'C. Gakpo', 'M. Depay', 'X. Simons', 'T. Reijnders'],
  ITA: ['G. Scamacca', 'F. Chiesa', 'N. Barella', 'R. Tonali', 'Immobile'],
  BEL: ['R. Lukaku', 'K. De Bruyne', 'D. Trossard', 'J. Doku', 'A. Onana'],
  URU: ['L. Núñez', 'D. Valverde', 'F. Pellistri', 'M. Ugarte', 'E. Cavani'],
  COL: ['L. Díaz', 'J. Rodríguez', 'R. Falcao', 'L. Sinisterra', 'Borja'],
  MEX: ['H. Lozano', 'R. Jiménez', 'C. Vela', 'A. Guardado', 'Antuna'],
  USA: ['C. Pulisic', 'W. McKennie', 'T. Adams', 'G. Weah', 'F. de la Torre'],
  CAN: ['A. David', 'C. Buchanan', 'J. Larin', 'S. Eustáquio', 'Davies'],
  JPN: ['T. Minamino', 'D. Ito', 'H. Maeda', 'W. Endo', 'R. Yamane'],
  KOR: ['Son Heung-min', 'Lee Jae-sung', 'Hwang Hee-chan', 'Kim Min-jae', 'Cho Gue-sung'],
  MAR: ['H. Ziyech', 'Y. En-Nesyri', 'A. Hakimi', 'S. Amallah', 'N. Aguerd'],
  SEN: ['S. Mané', 'I. Sarr', 'E. Mendy', 'K. Koulibaly', 'M. Diatta'],
  NGA: ['V. Osimhen', 'P. Nwankwo', 'A. Lookman', 'K. Iheanacho', 'S. Chukwueze'],
}

export function getTeamPlayers(tla) {
  return TEAM_PLAYERS[tla] || ['Hráč 1', 'Hráč 2', 'Hráč 3', 'Hráč 4', 'Hráč 5']
}
