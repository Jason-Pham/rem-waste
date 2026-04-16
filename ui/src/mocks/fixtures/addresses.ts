import type { Address } from '../../api/schemas';

// SW1A 1AA — Westminster area, ≥12 addresses per ASSESSMENT.md §4.
export const SW1A_1AA_ADDRESSES: Address[] = [
  { id: 'addr_sw1a_01', line1: '10 Downing Street',            city: 'London' },
  { id: 'addr_sw1a_02', line1: '11 Downing Street',            city: 'London' },
  { id: 'addr_sw1a_03', line1: '12 Downing Street',            city: 'London' },
  { id: 'addr_sw1a_04', line1: 'The Cabinet Office, 70 Whitehall', city: 'London' },
  { id: 'addr_sw1a_05', line1: '36 Whitehall',                 city: 'London' },
  { id: 'addr_sw1a_06', line1: 'Horse Guards Parade',          city: 'London' },
  { id: 'addr_sw1a_07', line1: 'Admiralty House, Whitehall',   city: 'London' },
  { id: 'addr_sw1a_08', line1: '1 Horse Guards Road',          city: 'London' },
  { id: 'addr_sw1a_09', line1: '100 Parliament Street',        city: 'London' },
  { id: 'addr_sw1a_10', line1: 'Parliament Square',            city: 'London' },
  { id: 'addr_sw1a_11', line1: 'Westminster Abbey, 20 Dean\'s Yard', city: 'London' },
  { id: 'addr_sw1a_12', line1: 'St James\'s Park',             city: 'London' },
  { id: 'addr_sw1a_13', line1: 'Buckingham Palace',            city: 'London' },
  { id: 'addr_sw1a_14', line1: 'Clarence House, Stable Yard',  city: 'London' },
];

// BS1 4DJ — Bristol city centre, populated on retry.
export const BS1_4DJ_ADDRESSES: Address[] = [
  { id: 'addr_bs1_01', line1: '1 Broad Quay',                  city: 'Bristol' },
  { id: 'addr_bs1_02', line1: '2 Broad Quay',                  city: 'Bristol' },
  { id: 'addr_bs1_03', line1: '3 Broad Quay',                  city: 'Bristol' },
  { id: 'addr_bs1_04', line1: '10 Colston Avenue',             city: 'Bristol' },
  { id: 'addr_bs1_05', line1: '14 Colston Avenue',             city: 'Bristol' },
  { id: 'addr_bs1_06', line1: 'The Centre, Bristol',           city: 'Bristol' },
];

// M1 1AE — Manchester, returned after simulated latency.
export const M1_1AE_ADDRESSES: Address[] = [
  { id: 'addr_m1_01', line1: '1 Piccadilly',                   city: 'Manchester' },
  { id: 'addr_m1_02', line1: '10 Piccadilly',                  city: 'Manchester' },
  { id: 'addr_m1_03', line1: '1 Portland Street',              city: 'Manchester' },
  { id: 'addr_m1_04', line1: 'Piccadilly Gardens',             city: 'Manchester' },
];
