/**
 * The stations of the About page's "Ascent": the roles listed top-down by altitude in
 * the governance stack, global to private sector, with the private-sector rung holding
 * two. Read as a column it is reverse-chronological by start date; read as height it is
 * the ascent itself. (The CV orders the same roles by end date, so TKB, which ran on
 * through the RBC Lab and EGMONT months, sits second there and fourth here.) Cities stay
 * off the stations on purpose: the journey-arc strip below the section already carries
 * geography, and it includes Genoa, which no role does.
 *
 * `output` links a station to a publishable result of the role (a Projects entry, a
 * Note, a publication); leave it out rather than linking an institution's home page.
 * Organisation names, role titles, periods and markets follow content/pages/cv.mdx.
 */
export type Altitude = 'global' | 'eu' | 'national' | 'firm';

export interface Station {
  altitude: Altitude;
  /** The axis label: how high in the stack this role sat. */
  label: string;
  org: string;
  role: string;
  period: string;
  body: string;
  output?: {
    label: string;
    href: string;
  };
}

export const stations: Station[] = [
  {
    altitude: 'global',
    label: 'Global',
    org: 'United Nations Global Compact',
    role: 'Leadership and Policy Advocacy',
    period: 'Jul–Oct 2025',
    body: 'I worked with the Leadership & Policy team on corporate sustainability and responsible business conduct, contributing research toward high-level outputs including the 2025 CEO Study, and supporting stakeholder engagement during UN General Assembly High-Level Week.',
    output: {
      label: '2025 CEO Study',
      href: 'https://info.unglobalcompact.org/ceo-study-2025',
    },
  },
  {
    altitude: 'eu',
    label: 'European Union',
    org: 'EGMONT Royal Institute for International Relations',
    role: 'Research and Communications Intern',
    period: 'Sep 2024–Jan 2025',
    body: 'I coordinated communications across departments and worked alongside diplomats, parliamentarians, and policy actors shaping the European policy environment, and helped launch the institute’s podcast.',
    output: {
      label: 'Global Affairs Unpacked',
      href: '/projects/#global-affairs-unpacked-egmont-institute',
    },
  },
  {
    altitude: 'national',
    label: 'National & academic',
    org: 'University of Amsterdam, Responsible Business Conduct Lab',
    role: 'Junior Researcher',
    period: 'Mar–Jul 2024',
    body: 'I built an original analytical framework and coding taxonomy to compare EU regulatory instruments (GDPR, CSRD, CSDDD, the EU Deforestation Regulation) across jurisdictions, using both qualitative and computational methods.',
  },
  {
    altitude: 'firm',
    label: 'Private sector',
    org: 'TKB',
    role: 'Accounts Analyst, then Client Responsible',
    period: 'Oct 2023–Mar 2025',
    body: 'I managed a portfolio of international B2B accounts across the Dutch, Belgian, French, Italian, and German markets, as clients’ primary point of contact through the full client lifecycle.',
  },
  {
    altitude: 'firm',
    label: 'Private sector',
    org: 'Just Eat Takeaway',
    role: 'Live Operations Specialist, Italian Market',
    period: 'May 2021–Jan 2023',
    body: 'I ran live operational workflow and KPI monitoring for the Italian market on a high-volume delivery platform, triaging incidents against service targets under time pressure.',
  },
];
