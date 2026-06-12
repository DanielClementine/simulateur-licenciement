/**
 * Conventions collectives supportées par le moteur officiel pour l'indemnité
 * de licenciement (47 CC).
 *
 * Données : IDCC = clés de @socialgouv/modeles-social (indemniteLicenciementModeles) ;
 * titres = source officielle SocialGouv/kali-data. Triées par nom court.
 * Régénérer si le paquet ajoute des conventions.
 */
export interface ConventionCollective {
  idcc: string;
  shortTitle: string;
  title: string;
}

export const CONVENTIONS_COLLECTIVES: ConventionCollective[] = [
  {
    "idcc": "2941",
    "shortTitle": "Aide, accompagnement, soins et services à domicile (BAD)",
    "title": "Convention collective nationale de la branche de l'aide, de l'accompagnement, des soins et des services à domicile"
  },
  {
    "idcc": "2120",
    "shortTitle": "Banque",
    "title": "Convention collective nationale de la banque"
  },
  {
    "idcc": "2609",
    "shortTitle": "Bâtiment ETAM",
    "title": "Convention collective nationale des employés, techniciens et agents de maîtrise du bâtiment"
  },
  {
    "idcc": "1596",
    "shortTitle": "Bâtiment Ouvriers (entreprises occupant jusqu'à 10 salariés)",
    "title": "Convention collective nationale concernant les ouvriers employés par les entreprises du bâtiment visées par le décret du 1er mars 1962 - c'est-à-dire occupant jusqu'à 10 salariés"
  },
  {
    "idcc": "1597",
    "shortTitle": "Bâtiment Ouvriers (entreprises occupant plus de 10 salariés)",
    "title": "Convention collective nationale concernant les ouvriers employés par les entreprises du bâtiment non visées par le décret 1er mars 1962 -c'est-à-dire occupant plus de 10 salariés"
  },
  {
    "idcc": "1740",
    "shortTitle": "Bâtiment ouvriers (région parisienne)",
    "title": "Convention collective régionale des ouvriers du bâtiment de la région parisienne"
  },
  {
    "idcc": "843",
    "shortTitle": "Boulangerie-pâtisserie (entreprises artisanales)",
    "title": "Convention collective nationale de la boulangerie-pâtisserie -entreprises artisanales"
  },
  {
    "idcc": "1606",
    "shortTitle": "Bricolage (vente au détail en libre-service)",
    "title": "Convention collective nationale du bricolage"
  },
  {
    "idcc": "1486",
    "shortTitle": "Bureaux d'études techniques, cabinets d'ingénieurs-conseils et sociétés de conseils",
    "title": "Convention collective nationale applicable au personnel des bureaux d'études techniques, des cabinets d'ingénieurs-conseils et des sociétés de conseils(BET, SYNTEC)"
  },
  {
    "idcc": "2596",
    "shortTitle": "Coiffure et professions connexes",
    "title": "Convention collective nationale de la coiffure et des professions connexes"
  },
  {
    "idcc": "1505",
    "shortTitle": "Commerce de détail alimentaire non spécialisé",
    "title": "Convention collective nationale du commerce de détail de fruits et légumes, épicerie et produits laitiers"
  },
  {
    "idcc": "1483",
    "shortTitle": "Commerce de détail de l'habillement et des articles textiles",
    "title": "Convention collective nationale du commerce de détail de l'habillement et des articles textiles"
  },
  {
    "idcc": "2216",
    "shortTitle": "Commerce de détail et de gros à prédominance alimentaire",
    "title": "Convention collective nationale du commerce de détail et de gros à prédominance alimentaire"
  },
  {
    "idcc": "1517",
    "shortTitle": "Commerces de détail non alimentaires : antiquités, brocante, galeries d'art (œuvres d'art), arts de la table, coutellerie, droguerie, équipement du foyer, bazars, commerces ménagers, modélisme, jeux, jouets, puérinatalité, maroquinerie, presse et jeux de hasard ou pronostics, produits de la vape",
    "title": "Convention collective nationale des commerces de détail non alimentaires : antiquités, brocante, galeries d'art, arts de la table, coutellerie, droguerie, équipement du foyer, bazars, commerces ménagers, modélisme, jeux, jouets, périnatalité et maroquinerie(œuvres d'art)"
  },
  {
    "idcc": "573",
    "shortTitle": "Commerces de gros",
    "title": "Convention collective nationale des commerces de gros"
  },
  {
    "idcc": "1518",
    "shortTitle": "Éducation, culture, loisirs et animation au service des territoires (ÉCLAT)",
    "title": "Convention collective nationale des métiers de l'éducation, de la culture, des loisirs et de l'animation agissant pour l'utilité sociale et environnementale, au service des territoires (ÉCLAT)"
  },
  {
    "idcc": "1404",
    "shortTitle": "Entreprises de la maintenance, distribution et location de matériels agricoles, de travaux publics, de bâtiment, de manutention, de motoculture de plaisance et activités connexes, dite SDLM",
    "title": "Convention collective nationale des entreprises de commerce, de location et de réparation de tracteurs, machines et matériels agricoles, de matériels de travaux publics, de bâtiment et de manutention, de matériels de motoculture de plaisance, de jardins et d'espaces verts (SEDIMA)"
  },
  {
    "idcc": "86",
    "shortTitle": "Entreprises de la publicité et assimilées",
    "title": "Convention collective nationale des entreprises de publicité et assimilées"
  },
  {
    "idcc": "1351",
    "shortTitle": "Entreprises de prévention et de sécurité",
    "title": "Convention collective nationale des entreprises de prévention et de sécurité"
  },
  {
    "idcc": "3043",
    "shortTitle": "Entreprises de propreté et services associés",
    "title": "Convention collective nationale des entreprises de propreté et services associés du 26 juillet 2011."
  },
  {
    "idcc": "3127",
    "shortTitle": "Entreprises de services à la personne",
    "title": "Convention collective nationale des services à la personne du 20 septembre 2012"
  },
  {
    "idcc": "1043",
    "shortTitle": "Gardiens, concierges et employés d'immeubles",
    "title": "Convention collective nationale des gardiens, concierges et employés d'immeubles"
  },
  {
    "idcc": "2264",
    "shortTitle": "Hospitalisation privée",
    "title": "Convention collective nationale de l'hospitalisation privée"
  },
  {
    "idcc": "1979",
    "shortTitle": "Hôtels, cafés, restaurants",
    "title": "Convention collective nationale des hôtels, cafés, restaurants (HCR)"
  },
  {
    "idcc": "1527",
    "shortTitle": "Immobilier : administrateurs de biens, sociétés immobilières, agents immobiliers",
    "title": "Convention collective nationale de l'immobilier"
  },
  {
    "idcc": "176",
    "shortTitle": "Industrie pharmaceutique",
    "title": "Convention collective nationale de l'industrie pharmaceutique"
  },
  {
    "idcc": "44",
    "shortTitle": "Industries chimiques et connexes",
    "title": "Convention collective nationale des industries chimiques et connexes"
  },
  {
    "idcc": "1480",
    "shortTitle": "Journalistes",
    "title": "Convention collective nationale des journalistes"
  },
  {
    "idcc": "675",
    "shortTitle": "Maisons à succursales de vente au détail d'habillement",
    "title": "Convention collective nationale des maisons à succursales de vente au détail d'habillement"
  },
  {
    "idcc": "3248",
    "shortTitle": "Métallurgie",
    "title": "Convention collective nationale de la métallurgie"
  },
  {
    "idcc": "1516",
    "shortTitle": "Organismes de formation",
    "title": "Convention collective nationale des organismes de formation"
  },
  {
    "idcc": "3239",
    "shortTitle": "Particuliers employeurs et emploi à domicile",
    "title": "Convention collective de la branche du secteur des particuliers employeurs et de l’emploi à domicile"
  },
  {
    "idcc": "787",
    "shortTitle": "Personnel des cabinets d'experts-comptables et de commissaires aux comptes",
    "title": "Convention collective nationale des cabinets d'experts-comptables et de commissaires aux comptes"
  },
  {
    "idcc": "1147",
    "shortTitle": "Personnel des cabinets médicaux",
    "title": "Convention collective nationale du personnel des cabinets médicaux (médecin)"
  },
  {
    "idcc": "1996",
    "shortTitle": "Pharmacie d'officine",
    "title": "Convention collective nationale de la pharmacie d'officine"
  },
  {
    "idcc": "292",
    "shortTitle": "Plasturgie",
    "title": "Convention collective nationale de la plasturgie (transformation des matières plastiques)"
  },
  {
    "idcc": "2098",
    "shortTitle": "Prestataires de services dans le domaine du secteur tertiaire",
    "title": "Convention collective nationale du personnel des prestataires de services dans le domaine du secteur tertiaire"
  },
  {
    "idcc": "1266",
    "shortTitle": "Restauration de collectivités",
    "title": "Convention collective nationale du personnel des entreprises de restauration de collectivités"
  },
  {
    "idcc": "1501",
    "shortTitle": "Restauration rapide",
    "title": "Convention collective nationale de la restauration rapide (restauration livrée)"
  },
  {
    "idcc": "1090",
    "shortTitle": "Services de l'automobile (Commerce et réparation de l'automobile, du cycle et du motocycle, activités connexes, contrôle technique automobile, formation des conducteurs)",
    "title": "Convention collective nationale des services de l'automobile (commerce et réparation de l'automobile, du cycle et du motocycle, activités connexes, contrôle technique automobile, formation des conducteurs auto-écoles CNPA)"
  },
  {
    "idcc": "1672",
    "shortTitle": "Sociétés d'assurances",
    "title": "Convention collective nationale des sociétés d'assurances"
  },
  {
    "idcc": "2511",
    "shortTitle": "Sport",
    "title": "Convention collective nationale du sport"
  },
  {
    "idcc": "2148",
    "shortTitle": "Télécommunications",
    "title": "Convention collective nationale des télécommunications"
  },
  {
    "idcc": "275",
    "shortTitle": "Transport aérien : personnel au sol",
    "title": "Convention collective nationale du personnel au sol des entreprises de transport aérien"
  },
  {
    "idcc": "16",
    "shortTitle": "Transports routiers et activités auxiliaires du transport",
    "title": "Convention collective nationale des transports routiers et activités auxiliaires du transport"
  },
  {
    "idcc": "1702",
    "shortTitle": "Travaux publics (Tome II : Ouvriers)",
    "title": "Convention collective nationale des ouvriers de travaux publics"
  },
  {
    "idcc": "2614",
    "shortTitle": "Travaux publics (Tome III : ETAM)",
    "title": "Convention collective nationale des employés, techniciens et agents de maîtrise des travaux publics"
  }
];

/** Normalise une chaîne pour la recherche (sans accents, minuscules). */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/** Recherche par nom ou par numéro IDCC. */
export function searchConventions(query: string): ConventionCollective[] {
  const q = normalize(query.trim());
  if (!q) return CONVENTIONS_COLLECTIVES;
  return CONVENTIONS_COLLECTIVES.filter(
    (c) =>
      normalize(c.shortTitle).includes(q) ||
      normalize(c.title).includes(q) ||
      c.idcc.includes(q)
  );
}
