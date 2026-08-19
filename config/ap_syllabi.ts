export interface APUnitSyllabus {
  unitNumber: number;
  unitName: string;
  weightPercentage: string;
  topics: string[];
}

export interface APQuestionItem {
  id: string;
  unit: string;
  topic: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface APFlashcardItem {
  id: string;
  unit: string;
  topic: string;
  question: string;
  answer: string;
  explanation: string;
}

export interface APFRQPromptItem {
  id: string;
  title: string;
  prompt: string;
  rubricSummary: string;
}

export interface APCourseFullSyllabus {
  slug: string;
  name: string;
  category: 'STEM' | 'HUMANITIES' | 'LANGUAGE';
  units: APUnitSyllabus[];
  questions: APQuestionItem[];
  flashcards: APFlashcardItem[];
  frqPrompts: APFRQPromptItem[];
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
    questions: [
      {
        id: 'chem-q1',
        unit: 'Unit 3: Intermolecular Forces and Properties',
        topic: 'Beer-Lambert Law',
        question: 'A student uses a spectrophotometer set at 635 nm to measure the absorbance of a solution of CuSO4. If the concentration of CuSO4 is doubled, which of the following best describes the change in absorbance?',
        options: [
          'The absorbance doubles because absorbance is directly proportional to concentration according to A = εbc.',
          'The absorbance decreases by half due to photon scattering.',
          'The absorbance remains constant because wavelength is unchanged.',
          'The absorbance quadruples as it scales with concentration squared.'
        ],
        correct: 0,
        explanation: 'According to the Beer-Lambert Law (A = εbc), absorbance (A) is directly proportional to concentration (c). Doubling c doubles A.'
      },
      {
        id: 'chem-q2',
        unit: 'Unit 8: Acids and Bases',
        topic: 'Henderson-Hasselbalch Equation & Buffers',
        question: 'A buffer solution contains equal equimolar amounts of CH3COOH (Ka = 1.8 × 10^-5, pKa = 4.74) and NaCH3COO. What is the pH of the buffer solution after a small amount of strong acid is added?',
        options: [
          'The pH decreases slightly below 4.74.',
          'The pH increases sharply to approximately 9.0.',
          'The pH remains exactly 7.00.',
          'The pH drops instantly to 1.0.'
        ],
        correct: 0,
        explanation: 'When [HA] = [A-], pH = pKa = 4.74. Adding a small amount of strong acid converts some conjugate base A- into weak acid HA, decreasing pH slightly below 4.74.'
      },
      {
        id: 'chem-q3',
        unit: 'Unit 7: Equilibrium',
        topic: 'Le Chatelier’s Principle',
        question: 'For the exothermic reaction N2(g) + 3H2(g) ⇌ 2NH3(g) (ΔH < 0), which condition will shift the equilibrium to favor the formation of NH3(g)?',
        options: [
          'Decreasing the temperature and increasing the total pressure of the container.',
          'Increasing the temperature and expanding container volume.',
          'Adding a catalyst without altering pressure.',
          'Removing N2(g) from the vessel at constant volume.'
        ],
        correct: 0,
        explanation: 'Because the forward reaction is exothermic, lowering temperature shifts equilibrium right toward products. Increasing pressure shifts equilibrium toward fewer gas moles (4 moles reactant -> 2 moles product).'
      }
    ],
    flashcards: [
      {
        id: 'chem-fc1',
        unit: 'Unit 3: Intermolecular Forces and Properties',
        topic: 'Ideal Gas Law Deviation',
        question: 'Under what conditions do real gases deviate most significantly from ideal gas behavior?',
        answer: 'High pressures and low temperatures.',
        explanation: 'At high pressure, particle volume is no longer negligible. At low temperature, intermolecular attractive forces slow collisions.'
      },
      {
        id: 'chem-fc2',
        unit: 'Unit 5: Kinetics',
        topic: 'First-Order Half-Life Formula',
        question: 'What is the half-life equation for a first-order chemical reaction?',
        answer: 't_1/2 = 0.693 / k',
        explanation: 'First-order half-life is independent of initial reactant concentration.'
      }
    ],
    frqPrompts: [
      {
        id: 'chem-frq1',
        title: 'Buffer Capacity and Titration Curve Analysis',
        prompt: 'A 25.0 mL sample of 0.100 M CH3COOH is titrated with 0.100 M NaOH. (a) Calculate the pH at the half-equivalence point. (b) Explain why the pH at the equivalence point is greater than 7.00.',
        rubricSummary: 'Half-equivalence point pH = pKa (4.74). Equivalence point pH > 7 due to hydrolysis of acetate ion (CH3COO- + H2O ⇌ CH3COOH + OH-).'
      }
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
    questions: [
      {
        id: 'calc-q1',
        unit: 'Unit 1: Limits and Continuity',
        topic: 'Trigonometric Limits & L’Hôpital’s Rule',
        question: 'Evaluate the limit: lim (x -> 0) [ sin(3x) / (2x) ].',
        options: [
          '3/2',
          '0',
          '1',
          'Undefined'
        ],
        correct: 0,
        explanation: 'Using lim(u->0)[sin(u)/u] = 1, lim(x->0)[sin(3x)/(2x)] = (3/2) * lim(x->0)[sin(3x)/(3x)] = (3/2) * 1 = 3/2.'
      },
      {
        id: 'calc-q2',
        unit: 'Unit 6: Integration and Accumulation of Change',
        topic: 'Fundamental Theorem of Calculus (FTC)',
        question: 'If g(x) = ∫_0^(x^2) e^(-t^2) dt, what is g’(x)?',
        options: [
          '2x * e^(-x^4)',
          'e^(-x^4)',
          'e^(-x^2)',
          '2x * e^(-x^2)'
        ],
        correct: 0,
        explanation: 'By FTC Part 1 and the Chain Rule: g’(x) = e^(-(x^2)^2) * d/dx(x^2) = 2x * e^(-x^4).'
      },
      {
        id: 'calc-q3',
        unit: 'Unit 8: Applications of Integration',
        topic: 'Volume of Revolution (Disc Method)',
        question: 'Find the volume of the solid generated when the region bounded by y = sqrt(x), y = 0, and x = 4 is revolved about the x-axis.',
        options: [
          '8π',
          '16π',
          '4π',
          '32π'
        ],
        correct: 0,
        explanation: 'Volume V = π ∫_0^4 [sqrt(x)]^2 dx = π ∫_0^4 x dx = π [x^2/2]_0^4 = π (16/2) = 8π.'
      }
    ],
    flashcards: [
      {
        id: 'calc-fc1',
        unit: 'Unit 5: Analytical Applications of Differentiation',
        topic: 'Mean Value Theorem Hypothesis',
        question: 'What conditions must f(x) satisfy on [a, b] for the Mean Value Theorem to apply?',
        answer: 'f must be continuous on [a, b] and differentiable on (a, b).',
        explanation: 'If satisfied, there exists c in (a, b) such that f’(c) = [f(b) - f(a)] / (b - a).'
      }
    ],
    frqPrompts: [
      {
        id: 'calc-frq1',
        title: 'Particle Motion along a Line',
        prompt: 'A particle moves along the x-axis with velocity v(t) = t^2 - 4t + 3 for 0 <= t <= 5. (a) Find all times t when the particle is at rest. (b) Find the total distance traveled by the particle on [0, 5].',
        rubricSummary: '(a) Set v(t) = (t - 1)(t - 3) = 0 => t = 1, 3. (b) Integrate |v(t)| dt from 0 to 5 by splitting integrals at t = 1 and t = 3.'
      }
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
    questions: [
      {
        id: 'push-q1',
        unit: 'Period 3: 1754–1800',
        topic: 'Hamiltonian Economic Plan vs Jeffersonian Opposition',
        question: 'Which of the following historical debates best reflects the early political divide between Alexander Hamilton and Thomas Jefferson in the 1790s?',
        options: [
          'The establishment of a National Bank and the interpretation of federal constitutional powers.',
          'Whether to annex Texas as a slave state.',
          'The passage of the Compromise of 1850.',
          'The adoption of the Marshall Plan following World War II.'
        ],
        correct: 0,
        explanation: 'Hamilton advocated loose constitutional interpretation to create the First Bank of the United States, whereas Jefferson insisted on strict constructionism.'
      },
      {
        id: 'push-q2',
        unit: 'Period 7: 1890–1945',
        topic: 'New Deal & Federal Power Expansion',
        question: 'The passage of Franklin D. Roosevelt’s New Deal legislation in the 1930s represented a fundamental shift in American government by:',
        options: [
          'Establishing a permanent social safety net and federal responsibility for economic stability.',
          'Abolishing the federal income tax to encourage private investment.',
          'Restricting executive orders during economic panics.',
          'Eliminating all federal regulatory agencies.'
        ],
        correct: 0,
        explanation: 'The New Deal created federal programs (Social Security, FDIC, SEC) establishing federal economic intervention and social welfare.'
      }
    ],
    flashcards: [
      {
        id: 'push-fc1',
        unit: 'Period 5: 1844–1877',
        topic: '14th Amendment Principle',
        question: 'What principle did the 14th Amendment establish in 1868?',
        answer: 'Equal protection under the law and citizenship for all persons born or naturalized in the US.',
        explanation: 'Overturned the Dred Scott decision and guaranteed due process.'
      }
    ],
    frqPrompts: [
      {
        id: 'push-frq1',
        title: 'Sectional Tensions and the Civil War (DBQ)',
        prompt: 'Evaluate the extent to which debates over slavery in the territories contributed to the outbreak of the Civil War from 1848 to 1861.',
        rubricSummary: 'Thesis (1 pt), Contextualization (1 pt), Evidence from Documents (2 pts), Outside Evidence (1 pt), Sourcing/POV (1 pt), Complexity (1 pt).'
      }
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
    questions: [
      {
        id: 'bio-q1',
        unit: 'Unit 7: Natural Selection',
        topic: 'Hardy-Weinberg Equilibrium',
        question: 'In a butterfly population in Hardy-Weinberg equilibrium, 16% of the butterflies exhibit a recessive white wing phenotype (q^2 = 0.16). What is the frequency of the dominant allele (p)?',
        options: [
          '0.60',
          '0.40',
          '0.84',
          '0.36'
        ],
        correct: 0,
        explanation: 'q^2 = 0.16 => q = sqrt(0.16) = 0.40. Since p + q = 1.0, p = 1.0 - 0.40 = 0.60.'
      }
    ],
    flashcards: [
      {
        id: 'bio-fc1',
        unit: 'Unit 3: Cellular Energetics',
        topic: 'Enzyme Competitive Inhibition',
        question: 'How do competitive inhibitors affect enzyme Vmax and Km?',
        answer: 'Vmax remains unchanged; Km increases.',
        explanation: 'Competitive inhibitors bind to the active site; adding sufficient substrate outcompetes the inhibitor to reach Vmax.'
      }
    ],
    frqPrompts: [
      {
        id: 'bio-frq1',
        title: 'Signal Transduction Pathway and Mutation Analysis',
        prompt: 'Describe the steps of a G-protein coupled receptor (GPCR) pathway. Predict the cellular effect if a mutation locks the G-protein in a permanently GTP-bound active state.',
        rubricSummary: 'Ligand binding -> GPCR conformational change -> GTP replaces GDP -> adenylyl cyclase activation -> cAMP production. Permanent GTP binding leads to continuous pathway activation regardless of ligand.'
      }
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
    questions: [
      {
        id: 'wh-q1',
        unit: 'Unit 2: Networks of Exchange (1200–1450)',
        topic: 'Indian Ocean Trade Monsoon Winds',
        question: 'Which technological and environmental factor was most essential to the expansion of Indian Ocean trade between 1200 and 1450?',
        options: [
          'Knowledge of seasonal monsoon wind patterns and dhow ships with lateen sails.',
          'Construction of the Trans-Siberian Railroad.',
          'Development of steam-powered ironclad vessels.',
          'Invention of the printing press in Western Europe.'
        ],
        correct: 0,
        explanation: 'Merchants utilized predictable monsoon winds and lateen sail technology to navigate Indian Ocean trade routes connecting East Africa, Arabia, India, and Southeast Asia.'
      }
    ],
    flashcards: [
      {
        id: 'wh-fc1',
        unit: 'Unit 3: Land-Based Empires',
        topic: 'Ottoman Devshirme System',
        question: 'What was the purpose of the Ottoman Devshirme system?',
        answer: 'To recruit non-Muslim Christian boys, convert them, and train them for military (Janissaries) or civil service.',
        explanation: 'Ensured a loyal civil and military elite independent of hereditary nobility.'
      }
    ],
    frqPrompts: [
      {
        id: 'wh-frq1',
        title: 'Industrialization and State Responses (LEQ)',
        prompt: 'Evaluate the extent to which non-Western states (such as Meiji Japan or the Ottoman Empire) successfully adopted Western industrialization techniques from 1750 to 1900.',
        rubricSummary: 'Thesis (1 pt), Contextualization (1 pt), Evidence (2 pts), Reasoning (1 pt), Complexity (1 pt).'
      }
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
    questions: [
      {
        id: 'lang-q1',
        unit: 'Unit 1: Rhetorical Situation',
        topic: 'Line of Reasoning & Counterargument',
        question: 'Which of the following best describes the function of a concession in an argumentative essay?',
        options: [
          'Acknowledging the validity of an opposing viewpoint to build ethos and strengthen the author’s overall line of reasoning.',
          'Repeating the primary thesis statement in every paragraph.',
          'Using emotional appeals to distract from lack of evidence.',
          'Refusing to address opposing evidence.'
        ],
        correct: 0,
        explanation: 'A concession demonstrates fairness and intellectual rigor, enhancing speaker credibility (ethos) while clarifying thesis boundaries.'
      }
    ],
    flashcards: [
      {
        id: 'lang-fc1',
        unit: 'Unit 4: Style and Tone',
        topic: 'Anaphora Rhetorical Device',
        question: 'Define the rhetorical device Anaphora.',
        answer: 'The repetition of a word or phrase at the beginning of successive clauses or sentences.',
        explanation: 'Example: "We shall fight on the beaches, we shall fight on the landing grounds..." Creates emphasis and rhythm.'
      }
    ],
    frqPrompts: [
      {
        id: 'lang-frq1',
        title: 'Rhetorical Analysis Essay',
        prompt: 'Analyze the rhetorical strategies that JFK uses in his 1961 Inaugural Address to inspire unity and outline America’s Cold War responsibilities.',
        rubricSummary: 'Thesis (1 pt), Evidence & Commentary (4 pts), Sophistication (1 pt).'
      }
    ],
    examStructure: {
      section1: { title: 'Section I: Multiple Choice Questions (Reading & Writing Passages)', questionsCount: 45, timeMinutes: 60, weight: '45%' },
      section2: { title: 'Section II: Free Response Essays (Synthesis, Rhetorical Analysis, Argument)', questionsCount: 3, timeMinutes: 135, weight: '55%' }
    }
  }
};
