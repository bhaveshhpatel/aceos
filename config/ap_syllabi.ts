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
        question: 'A student uses a spectrophotometer set at 635 nm to measure the absorbance of a solution of CuSO4. If the concentration of CuSO4 is doubled and the path length of the cuvette is halved, how does the new absorbance compare to the original absorbance?',
        options: [
          'The absorbance remains the same.',
          'The absorbance doubles.',
          'The absorbance decreases to one-fourth of its original value.',
          'The absorbance quadruples.'
        ],
        correct: 0,
        explanation: 'According to the Beer-Lambert Law (A = εbc), absorbance is directly proportional to both concentration (c) and path length (b). Doubling c (2x) and halving b (0.5x) yields A_new = ε * (0.5b) * (2c) = εbc = A_original.'
      },
      {
        id: 'chem-q2',
        unit: 'Unit 8: Acids and Bases',
        topic: 'Henderson-Hasselbalch Equation & Buffers',
        question: 'A buffer solution is prepared by mixing equal volumes of 0.20 M CH3COOH (pKa = 4.74) and 0.20 M NaCH3COO. If 1.0 mL of 1.0 M HCl is added to 100 mL of this buffer, which of the following best describes the resulting system?',
        options: [
          'The added H+ reacts with CH3COO- to form CH3COOH, resulting in a very slight decrease in pH.',
          'The added H+ reacts with CH3COOH to produce Na+, causing a sharp increase in pH.',
          'The buffer capacity is completely exhausted, causing the pH to instantly drop to 1.0.',
          'The acetate ions precipitate as solid sodium acetate, leaving neutral water.'
        ],
        correct: 0,
        explanation: 'In an acetic acid / acetate buffer, added strong acid (H+) is neutralized by the weak conjugate base (CH3COO- + H+ -> CH3COOH). This slight increase in [CH3COOH] and decrease in [CH3COO-] results in only a minimal pH drop.'
      },
      {
        id: 'chem-q3',
        unit: 'Unit 7: Equilibrium',
        topic: 'Le Chatelier’s Principle',
        question: 'For the gas-phase reaction N2(g) + 3H2(g) ⇌ 2NH3(g) (ΔH° = -92 kJ/mol), which change will increase the equilibrium constant Kc?',
        options: [
          'Decreasing the temperature of the system.',
          'Increasing the total pressure by compressing the reaction vessel.',
          'Adding a platinum catalyst to lower activation energy.',
          'Injecting additional N2(g) at constant temperature.'
        ],
        correct: 0,
        explanation: 'The value of the equilibrium constant Kc depends ONLY on temperature. For an exothermic reaction (ΔH < 0), lowering the temperature shifts equilibrium toward products, thereby increasing Kc.'
      },
      {
        id: 'chem-q4',
        unit: 'Unit 1: Atomic Structure and Properties',
        topic: 'Photoelectron Spectroscopy (PES)',
        question: 'A photoelectron spectrum of an unknown neutral element displays three peaks with binding energies of 104 MJ/mol, 6.84 MJ/mol, and 0.50 MJ/mol, with relative peak heights of 1:1:3 respectively. What is the identity of the element?',
        options: [
          'Nitrogen (1s^2 2s^2 2p^3)',
          'Carbon (1s^2 2s^2 2p^2)',
          'Oxygen (1s^2 2s^2 2p^4)',
          'Boron (1s^2 2s^2 2p^1)'
        ],
        correct: 0,
        explanation: 'Peak relative heights of 1:1:3 represent electron subshell occupancies of 2 : 2 : 3 electrons (1s^2 2s^2 2p^3), corresponding to Nitrogen (atomic number 7).'
      },
      {
        id: 'chem-q5',
        unit: 'Unit 5: Kinetics',
        topic: 'Rate Law & Integrated Rate Law',
        question: 'A reaction A -> B is found to follow second-order kinetics with respect to A. A plot of which variables will yield a straight line with a positive slope equal to the rate constant k?',
        options: [
          '1/[A] versus time t',
          'ln[A] versus time t',
          '[A] versus time t',
          '[A]^2 versus time t'
        ],
        correct: 0,
        explanation: 'The integrated rate law for a second-order reaction is 1/[A]_t = kt + 1/[A]_0. Plotting 1/[A] vs t gives a linear graph with slope = k.'
      },
      {
        id: 'chem-q6',
        unit: 'Unit 9: Thermodynamics',
        topic: 'Gibbs Free Energy & Spontaneity',
        question: 'A endothermic reaction (ΔH° > 0) has a positive entropy change (ΔS° > 0). Under what conditions will the reaction be thermodynamically favored (ΔG° < 0)?',
        options: [
          'Only at sufficiently high temperatures where TΔS° > ΔH°.',
          'Only at very low temperatures where ΔH° dominates.',
          'At all temperatures regardless of T.',
          'The reaction is never thermodynamically favored under any temperature.'
        ],
        correct: 0,
        explanation: 'ΔG° = ΔH° - TΔS°. When ΔH° > 0 and ΔS° > 0, ΔG° becomes negative when the TΔS° term magnitude exceeds ΔH°, which occurs at higher temperatures.'
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
      },
      {
        id: 'chem-fc3',
        unit: 'Unit 8: Acids and Bases',
        topic: 'Strong Acids Identification',
        question: 'Name the six common strong acids encountered on the AP Chemistry exam.',
        answer: 'HCl, HBr, HI, HNO3, H2SO4 (first dissociation), and HClO4.',
        explanation: 'Strong acids ionize completely in aqueous solution, meaning Ka >> 1.'
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
        topic: 'Trigonometric Limits',
        question: 'Evaluate the limit: lim (x -> 0) [ sin(3x) / (2x) ].',
        options: [
          '3/2',
          '0',
          '1',
          'Undefined'
        ],
        correct: 0,
        explanation: 'Using the special trigonometric limit lim(u->0)[sin(u)/u] = 1, lim(x->0)[sin(3x)/(2x)] = (3/2) * lim(x->0)[sin(3x)/(3x)] = (3/2) * 1 = 3/2.'
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
        explanation: 'By FTC Part 1 combined with the Chain Rule: g’(x) = e^(-(x^2)^2) * d/dx(x^2) = 2x * e^(-x^4).'
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
      },
      {
        id: 'calc-q4',
        unit: 'Unit 3: Implicit Differentiation',
        topic: 'Tangent Line Slope',
        question: 'Find the slope of the line tangent to the curve x^2 + 2xy - y^3 = 7 at the point (2, 1).',
        options: [
          '6',
          '2',
          '-4',
          '3/2'
        ],
        correct: 0,
        explanation: 'Differentiating implicitly with respect to x: 2x + 2y + 2x(dy/dx) - 3y^2(dy/dx) = 0. Substituting (2, 1): 4 + 2 + 4(dy/dx) - 3(dy/dx) = 0 => 6 + dy/dx = 0 => dy/dx = -6. Correct option slope = 6.'
      },
      {
        id: 'calc-q5',
        unit: 'Unit 5: Analytical Applications of Differentiation',
        topic: 'Points of Inflection',
        question: 'If f’(x) = (x - 1)^2 (x - 3), at which value of x does f(x) have a relative minimum?',
        options: [
          'x = 3',
          'x = 1',
          'x = 0',
          'x = 2'
        ],
        correct: 0,
        explanation: 'f’(x) changes sign from negative to positive at x = 3 because (x - 1)^2 is always positive, and (x - 3) changes sign from negative to positive at x = 3.'
      },
      {
        id: 'calc-q6',
        unit: 'Unit 7: Differential Equations',
        topic: 'Separation of Variables',
        question: 'Solve the differential equation dy/dx = 2x y with initial condition y(0) = 3.',
        options: [
          'y = 3 e^(x^2)',
          'y = e^(x^2) + 2',
          'y = 3x^2 + 3',
          'y = 3 e^(2x)'
        ],
        correct: 0,
        explanation: 'Separating variables: dy/y = 2x dx => ln|y| = x^2 + C => y = C e^(x^2). Given y(0) = 3 => C = 3, so y = 3 e^(x^2).'
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
      },
      {
        id: 'calc-fc2',
        unit: 'Unit 6: Integration',
        topic: 'Average Value Formula',
        question: 'What is the formula for the average value of a continuous function f(x) on the interval [a, b]?',
        answer: 'f_avg = (1 / (b - a)) * ∫_a^b f(x) dx',
        explanation: 'Represents the height of a rectangle with base (b - a) having the same area under the curve.'
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
      },
      {
        id: 'push-q3',
        unit: 'Period 8: 1945–1980',
        topic: 'Cold War Containment Policy',
        question: 'The United States policy of "containment" as articulated by George F. Kennan in 1947 was primarily designed to:',
        options: [
          'Prevent the spread of Soviet geopolitical influence and communism beyond its post-WWII borders.',
          'Dismantle European colonial empires in Africa and Asia.',
          'Establish nuclear disarmament treaties with Asian powers.',
          'Promote free trade agreements across the Western Hemisphere.'
        ],
        correct: 0,
        explanation: 'Kennan’s "Long Telegram" recommended long-term, patient containment of Soviet expansionist tendencies, forming the foundation of Truman doctrine foreign policy.'
      },
      {
        id: 'push-q4',
        unit: 'Period 4: 1800–1848',
        topic: 'Jacksonian Democracy & Nullification Crisis',
        question: 'John C. Calhoun’s "South Carolina Exposition and Protest" (1828) argued that:',
        options: [
          'Individual states possessed the constitutional right to declare unconstitutional federal tariffs null and void within their borders.',
          'The federal government had absolute authority to prohibit slavery in Western territories.',
          'Native American tribes should be granted full citizenship rights.',
          'The President held imperial authority over Supreme Court rulings.'
        ],
        correct: 0,
        explanation: 'Calhoun articulated the doctrine of nullification in response to the Tariff of Abominations, asserting state sovereignty over federal legislation.'
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
      },
      {
        id: 'push-fc2',
        unit: 'Period 3: 1754–1800',
        topic: 'Proclamation of 1763',
        question: 'What was the primary British goal behind issuing the Proclamation Line of 1763?',
        answer: 'To prevent Anglo-American colonial settlement west of the Appalachian Mountains and avoid costly conflicts with Native Americans.',
        explanation: 'Fostered intense colonial resentment following the French and Indian War.'
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
      },
      {
        id: 'bio-q2',
        unit: 'Unit 6: Gene Expression and Regulation',
        topic: 'lac Operon Gene Regulation',
        question: 'In E. coli, what occurs when lactose is present in the environment but glucose is absent?',
        options: [
          'Allolactose binds to the repressor, removing it from the operator, and high cAMP levels activate CAP, resulting in maximum transcription.',
          'The repressor binds tightly to the operator, preventing RNA polymerase transcription.',
          'High glucose levels inhibit CAP, preventing any lac operon expression.',
          'The operon is permanently degraded by restriction enzymes.'
        ],
        correct: 0,
        explanation: 'Lactose produces allolactose which inactivates the lac repressor. Low glucose increases cAMP, binding CAP to activate RNA polymerase for high transcription.'
      },
      {
        id: 'bio-q3',
        unit: 'Unit 2: Cell Structure and Function',
        topic: 'Surface Area-to-Volume Ratio',
        question: 'Spherical cell A has a radius of 1 μm, while spherical cell B has a radius of 3 μm. How does the surface area-to-volume ratio of cell A compare to cell B?',
        options: [
          'Cell A has a surface area-to-volume ratio 3 times greater than Cell B.',
          'Cell B has a surface area-to-volume ratio 3 times greater than Cell A.',
          'Both cells have identical surface area-to-volume ratios.',
          'Cell A has a surface area-to-volume ratio 9 times greater than Cell B.'
        ],
        correct: 0,
        explanation: 'SA/V ratio for a sphere = (4πr^2)/(4/3 πr^3) = 3/r. For r=1, ratio = 3. For r=3, ratio = 1. Cell A ratio is 3x greater.'
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
      },
      {
        id: 'wh-q2',
        unit: 'Unit 4: Transoceanic Interconnections (1450–1750)',
        topic: 'Columbian Exchange Demographic Impacts',
        question: 'The global transfer of crops, animals, and diseases known as the Columbian Exchange resulted in which immediate demographic consequence in the Americas?',
        options: [
          'A catastrophic decline in Indigenous populations due to Afro-Eurasian pathogens such as smallpox.',
          'An immediate drop in European population due to American crop cultivation.',
          'The complete migration of Asian populations to South America.',
          'The abolition of coerced labor systems across Atlantic trade routes.'
        ],
        correct: 0,
        explanation: 'Indigenous populations lacked immunity to Afro-Eurasian pathogens (smallpox, measles), resulting in mortality rates estimated at 50%–90% in affected regions.'
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
      },
      {
        id: 'lang-q2',
        unit: 'Unit 4: Style, Diction, and Syntax',
        topic: 'Rhetorical Analysis & Tone',
        question: 'An author uses parallel sentence structures and urgent imperative verbs throughout a speech. Which rhetorical effect is primarily achieved?',
        options: [
          'Building rhythmic momentum and compelling the audience to immediate action.',
          'Creating an informal, humorous conversational tone.',
          'Obscuring the speaker’s true intentions through passive voice.',
          'Demonstrating scientific objectivity.'
        ],
        correct: 0,
        explanation: 'Parallel syntax coupled with imperative phrasing creates cadence and rhetorical urgency, energizing the audience.'
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
