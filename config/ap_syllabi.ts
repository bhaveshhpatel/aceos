export interface APUnitSyllabus {
  unitNumber: number;
  unitName: string;
  weightPercentage: string;
  topics: string[];
}

export interface APCourseFullSyllabus {
  slug: string;
  name: string;
  category: 'STEM' | 'HUMANITIES' | 'LANGUAGE';
  units: APUnitSyllabus[];
  examStructure: {
    section1: { title: string; questionsCount: number; timeMinutes: number; weight: string };
    section2: { title: string; questionsCount: number; timeMinutes: number; weight: string };
  };
}

export const OFFICIAL_AP_SYLLABI: Record<string, APCourseFullSyllabus> = {
  'ap-chemistry': {
    slug: 'ap-chemistry',
    name: 'AP Chemistry',
    category: 'STEM',
    units: [
      { unitNumber: 1, unitName: 'Atomic Structure and Properties', weightPercentage: '7–9%', topics: ['Moles & Molar Mass', 'Mass Spectroscopy', 'Electron Configuration', 'Photoelectron Spectroscopy', 'Periodic Trends'] },
      { unitNumber: 2, unitName: 'Molecular and Ionic Compound Structure and Properties', weightPercentage: '7–9%', topics: ['Types of Chemical Bonds', 'Intramolecular Force & Potential Energy', 'Structure of Ionic Solids', 'Lewis Diagrams', 'VSEPR & Bond Hybridization'] },
      { unitNumber: 3, unitName: 'Intermolecular Forces and Properties', weightPercentage: '18–22%', topics: ['Intermolecular Forces', 'Solids, Liquids, & Gases', 'Ideal Gas Law', 'Kinetic Molecular Theory', 'Solutions & Solubility', 'Beer-Lambert Law'] },
      { unitNumber: 4, unitName: 'Chemical Reactions', weightPercentage: '7–9%', topics: ['Net Ionic Equations', 'Representing Reactions', 'Physical & Chemical Changes', 'Stoichiometry', 'Types of Chemical Reactions'] },
      { unitNumber: 5, unitName: 'Kinetics', weightPercentage: '7–9%', topics: ['Reaction Rates', 'Rate Law', 'Integrated Rate Law', 'Collision Model', 'Reaction Mechanisms', 'Catalysis'] },
      { unitNumber: 6, unitName: 'Thermodynamics', weightPercentage: '7–9%', topics: ['Endothermic & Exothermic Processes', 'Energy Diagrams', 'Heat Capacity & Calorimetry', 'Enthalpy of Reaction', 'Hess’s Law'] },
      { unitNumber: 7, unitName: 'Equilibrium', weightPercentage: '7–9%', topics: ['Introduction to Equilibrium', 'Direction of Reversible Reactions', 'Equilibrium Constant (Kc & Kp)', 'Le Chatelier’s Principle', 'Solubility Equilibria (Ksp)'] },
      { unitNumber: 8, unitName: 'Acids and Bases', weightPercentage: '11–15%', topics: ['Introduction to Acids & Bases', 'pH and pOH', 'Weak Acid & Base Equilibria', 'Acid-Base Reactions & Buffers', 'Titrations', 'Henderson-Hasselbalch Equation'] },
      { unitNumber: 9, unitName: 'Applications of Thermodynamics', weightPercentage: '7–9%', topics: ['Entropy', 'Absolute Entropy & Entropy Change', 'Gibbs Free Energy', 'Free Energy & Equilibrium', 'Galvanic & Electrolytic Cells'] }
    ],
    examStructure: {
      section1: { title: 'Section I: Multiple Choice Questions (MCQ)', questionsCount: 60, timeMinutes: 90, weight: '50%' },
      section2: { title: 'Section II: Free Response Questions (FRQ)', questionsCount: 7, timeMinutes: 105, weight: '50%' }
    }
  },
  'ap-calculus-ab': {
    slug: 'ap-calculus-ab',
    name: 'AP Calculus AB',
    category: 'STEM',
    units: [
      { unitNumber: 1, unitName: 'Limits and Continuity', weightPercentage: '10–12%', topics: ['Defining Limits', 'Estimating Limits from Graphs/Tables', 'Determining Limits Using Algebraic Properties', 'Squeeze Theorem', 'Continuity', 'Infinite Limits & Asymptotes'] },
      { unitNumber: 2, unitName: 'Differentiation: Definition and Fundamental Properties', weightPercentage: '10–12%', topics: ['Derivative at a Point', 'Derivative as a Function', 'Power Rule', 'Product Rule', 'Quotient Rule', 'Derivatives of Trigonometric Functions'] },
      { unitNumber: 3, unitName: 'Differentiation: Composite, Implicit, and Inverse Functions', weightPercentage: '9–13%', topics: ['Chain Rule', 'Implicit Differentiation', 'Differentiating Inverse Functions', 'Derivatives of Inverse Trig Functions'] },
      { unitNumber: 4, unitName: 'Contextual Applications of Differentiation', weightPercentage: '10–15%', topics: ['Rates of Change in Context', 'Straight-Line Motion', 'Related Rates', 'Linear Approximation & Differentials', 'L’Hôpital’s Rule'] },
      { unitNumber: 5, unitName: 'Analytical Applications of Differentiation', weightPercentage: '15–18%', topics: ['Mean Value Theorem', 'Extreme Value Theorem', 'Increasing/Decreasing Intervals', 'Concavity & Points of Inflection', 'Optimization Problems'] },
      { unitNumber: 6, unitName: 'Integration and Accumulation of Change', weightPercentage: '17–20%', topics: ['Riemann Sums', 'Definite Integrals', 'Fundamental Theorem of Calculus', 'Indefinite Integrals', 'Integration by Substitution (u-sub)'] },
      { unitNumber: 7, unitName: 'Differential Equations', weightPercentage: '6–12%', topics: ['Modeling with Differential Equations', 'Slope Fields', 'Separation of Variables', 'Exponential Growth & Decay'] },
      { unitNumber: 8, unitName: 'Applications of Integration', weightPercentage: '10–15%', topics: ['Average Value of a Function', 'Area Between Curves', 'Volumes of Solids with Known Cross Sections', 'Volumes of Revolution (Disc & Washer Methods)'] }
    ],
    examStructure: {
      section1: { title: 'Section I: Multiple Choice Questions (MCQ)', questionsCount: 45, timeMinutes: 105, weight: '50%' },
      section2: { title: 'Section II: Free Response Questions (FRQ)', questionsCount: 6, timeMinutes: 90, weight: '50%' }
    }
  },
  'ap-us-history': {
    slug: 'ap-us-history',
    name: 'AP US History',
    category: 'HUMANITIES',
    units: [
      { unitNumber: 1, unitName: 'Period 1: 1491–1607', weightPercentage: '4–6%', topics: ['Native American Societies Before European Contact', 'European Exploration in the Americas', 'Columbian Exchange', 'Labor, Slavery, & Caste in Spanish America'] },
      { unitNumber: 2, unitName: 'Period 2: 1607–1754', weightPercentage: '6–8%', topics: ['Contextualizing Period 2', 'European Colonization', 'The Regions of British Colonies', 'Transatlantic Trade', 'Interactions Between American Indians & Europeans', 'Slavery in the British Colonies'] },
      { unitNumber: 3, unitName: 'Period 3: 1754–1800', weightPercentage: '10–17%', topics: ['Seven Years’ War (French & Indian War)', 'Taxation Without Representation', 'Philosophical Foundations of the American Revolution', 'American Revolution', 'Articles of Confederation & Constitutional Convention', 'The Constitution & Bill of Rights', 'Developing an American Identity'] },
      { unitNumber: 4, unitName: 'Period 4: 1800–1848', weightPercentage: '10–17%', topics: ['Rise of Political Parties & Jeffersonian Democracy', 'Market Revolution', 'Jacksonian Democracy & Federal Power', 'Second Great Awakening & Reform Movements', 'African Americans in the Antebellum South'] },
      { unitNumber: 5, unitName: 'Period 5: 1844–1877', weightPercentage: '10–17%', topics: ['Manifest Destiny', 'Mexican-American War', 'Sectional Conflict & Compromise of 1850', 'Election of 1860 & Secession', 'Civil War', 'Reconstruction'] },
      { unitNumber: 6, unitName: 'Period 6: 1865–1898', weightPercentage: '10–17%', topics: ['Westward Expansion', 'Gilded Age Industrialization', 'Labor Movements & Populism', 'Immigration & Urbanization', 'Gilded Age Politics & Culture'] },
      { unitNumber: 7, unitName: 'Period 7: 1890–1945', weightPercentage: '17–20%', topics: ['Imperialism & Spanish-American War', 'Progressive Era', 'World War I & Home Front', '1920s Culture & Harlem Renaissance', 'Great Depression & New Deal', 'World War II'] },
      { unitNumber: 8, unitName: 'Period 8: 1945–1980', weightPercentage: '15–17%', topics: ['Cold War & Containment', 'Red Scare & Korean War', 'Postwar Economy & Suburbia', 'Civil Rights Movement', 'Vietnam War & 1960s Counterculture', 'Environmentalism & Rise of Conservatism'] },
      { unitNumber: 9, unitName: 'Period 9: 1980–Present', weightPercentage: '4–6%', topics: ['Reagan Revolution & Conservatism', 'End of the Cold War', 'Digital Revolution & Globalization', 'Post-9/11 Foreign Policy & 21st Century Challenges'] }
    ],
    examStructure: {
      section1: { title: 'Section I: Part A (MCQ) & Part B (Short Answer Questions)', questionsCount: 55, timeMinutes: 95, weight: '60%' },
      section2: { title: 'Section II: Document-Based Question (DBQ) & Long Essay (LEQ)', questionsCount: 2, timeMinutes: 100, weight: '40%' }
    }
  },
  'ap-biology': {
    slug: 'ap-biology',
    name: 'AP Biology',
    category: 'STEM',
    units: [
      { unitNumber: 1, unitName: 'Chemistry of Life', weightPercentage: '8–11%', topics: ['Structure of Water & Hydrogen Bonding', 'Elements of Life', 'Biological Macromolecules', 'Nucleic Acids'] },
      { unitNumber: 2, unitName: 'Cell Structure and Function', weightPercentage: '10–13%', topics: ['Cell Size & Surface Area-to-Volume Ratio', 'Plasma Membranes', 'Membrane Transport (Diffusion, Osmosis, Active Transport)', 'Cell Compartmentalization'] },
      { unitNumber: 3, unitName: 'Cellular Energetics', weightPercentage: '12–16%', topics: ['Enzyme Structure & Catalysis', 'Environmental Impacts on Enzyme Function', 'Cellular Respiration & Fermentation', 'Photosynthesis'] },
      { unitNumber: 4, unitName: 'Cell Communication and Cell Cycle', weightPercentage: '10–15%', topics: ['Cell Communication & Signal Transduction', 'Signal Response', 'Feedback Mechanisms', 'Cell Cycle & Mitosis'] },
      { unitNumber: 5, unitName: 'Heredity', weightPercentage: '8–11%', topics: ['Meiosis & Genetic Diversity', 'Mendelian Genetics', 'Non-Mendelian Genetics', 'Environmental Effects on Phenotype'] },
      { unitNumber: 6, unitName: 'Gene Expression and Regulation', weightPercentage: '12–16%', topics: ['DNA & RNA Structure', 'Replication', 'Transcription & RNA Processing', 'Translation', 'Gene Regulation & Operons', 'Biotechnology'] },
      { unitNumber: 7, unitName: 'Natural Selection', weightPercentage: '13–20%', topics: ['Introduction to Natural Selection', 'Hardy-Weinberg Equilibrium', 'Evidence of Evolution', 'Phylogeny', 'Speciation & Extinction'] },
      { unitNumber: 8, unitName: 'Ecology', weightPercentage: '10–15%', topics: ['Responses to the Environment', 'Energy Flow Through Ecosystems', 'Population Ecology', 'Community Ecology', 'Biodiversity'] }
    ],
    examStructure: {
      section1: { title: 'Section I: Multiple Choice Questions (MCQ)', questionsCount: 60, timeMinutes: 90, weight: '50%' },
      section2: { title: 'Section II: Free Response Questions (FRQ)', questionsCount: 6, timeMinutes: 90, weight: '50%' }
    }
  },
  'ap-world-history': {
    slug: 'ap-world-history',
    name: 'AP World History: Modern',
    category: 'HUMANITIES',
    units: [
      { unitNumber: 1, unitName: 'The Global Tapestry (1200–1450)', weightPercentage: '8–10%', topics: ['East Asia', 'Dar al-Islam', 'South & Southeast Asia', 'State Building in the Americas & Africa', 'Developments in Europe'] },
      { unitNumber: 2, unitName: 'Networks of Exchange (1200–1450)', weightPercentage: '8–10%', topics: ['Silk Roads', 'The Mongol Empire', 'Indian Ocean Trade', 'Trans-Saharan Trade Routes', 'Cultural & Environmental Consequences of Connectivity'] },
      { unitNumber: 3, unitName: 'Land-Based Empires (1450–1750)', weightPercentage: '12–15%', topics: ['Expansion of Empires (Ottoman, Safavid, Mughal, Qing, Russian)', 'Empires: Administration & Belief Systems'] },
      { unitNumber: 4, unitName: 'Transoceanic Interconnections (1450–1750)', weightPercentage: '12–15%', topics: ['Technological Innovations in Maritime Exploration', 'Columbian Exchange', 'Maritime Empires Established', 'Resistance to Empire Building'] },
      { unitNumber: 5, unitName: 'Revolutions (1750–1900)', weightPercentage: '12–15%', topics: ['The Enlightenment', 'Nationalism & Revolutions (American, French, Haitian, Latin American)', 'Industrial Revolution', 'State-Guided Industrialization'] },
      { unitNumber: 6, unitName: 'Consequences of Industrialization (1750–1900)', weightPercentage: '12–15%', topics: ['Rationales for Imperialism', 'State Expansion in Africa & Asia', 'Indigenous Responses to Imperialism', 'Global Economic Development & Migration'] },
      { unitNumber: 7, unitName: 'Global Conflict (1900–Present)', weightPercentage: '8–10%', topics: ['Shifting Power After 1900', 'World War I', 'Interwar Period & Great Depression', 'World War II', 'Mass Atrocities'] },
      { unitNumber: 8, unitName: 'Cold War and Decolonization (1900–Present)', weightPercentage: '8–10%', topics: ['Cold War & Superpower Rivalry', 'Spread of Communism', 'Decolonization in South Asia, Africa, & Middle East', 'New Independent States'] },
      { unitNumber: 9, unitName: 'Globalization (1900–Present)', weightPercentage: '8–10%', topics: ['Advances in Science & Technology', 'Disease & Global Health', 'Global Economics & Environmental Resistance', 'Globalized Culture & Reform'] }
    ],
    examStructure: {
      section1: { title: 'Section I: Part A (MCQ) & Part B (Short Answer Questions)', questionsCount: 55, timeMinutes: 95, weight: '60%' },
      section2: { title: 'Section II: Document-Based Question (DBQ) & Long Essay (LEQ)', questionsCount: 2, timeMinutes: 100, weight: '40%' }
    }
  },
  'ap-lang': {
    slug: 'ap-lang',
    name: 'AP English Language & Composition',
    category: 'HUMANITIES',
    units: [
      { unitNumber: 1, unitName: 'Rhetorical Financial & Audience Context', weightPercentage: 'Exam Essay Skill', topics: ['Identifying Claims and Line of Reasoning', 'Audience, Purpose, and Rhetorical Situation'] },
      { unitNumber: 2, unitName: 'Structure and Synthesis', weightPercentage: 'Exam Essay Skill', topics: ['Organization and Transitional Cohesion', 'Integrating Evidence Across Multiple Sources'] },
      { unitNumber: 3, unitName: 'Claims and Argumentation', weightPercentage: 'Exam Essay Skill', topics: ['Developing Defensible Thesis Statements', 'Counterarguments and Rebuttals'] },
      { unitNumber: 4, unitName: 'Style, Diction, and Syntax', weightPercentage: 'Exam Essay Skill', topics: ['Tone and Word Choice', 'Syntax Variations and Rhetorical Impact'] },
      { unitNumber: 5, unitName: 'Advanced Synthesis and DBQ Writing', weightPercentage: 'Exam Essay Skill', topics: ['Evaluating Source Reliability', 'Synthesizing 6+ Documents in Persuasive Essay'] },
      { unitNumber: 6, unitName: 'Rhetorical Analysis Essay Mastery', weightPercentage: 'Exam Essay Skill', topics: ['Analyzing Speeches, Essays, & Historical Documents', 'Rhetorical Devices (Ethos, Pathos, Logos)'] },
      { unitNumber: 7, unitName: 'Argumentative Essay Mastery', weightPercentage: 'Exam Essay Skill', topics: ['Persuasive Writing from Real-World Knowledge', 'Nuanced Evidence Selection'] }
    ],
    examStructure: {
      section1: { title: 'Section I: Multiple Choice Questions (Reading & Writing Passages)', questionsCount: 45, timeMinutes: 60, weight: '45%' },
      section2: { title: 'Section II: Free Response Essays (Synthesis, Rhetorical Analysis, Argument)', questionsCount: 3, timeMinutes: 135, weight: '55%' }
    }
  }
};
