import { logger } from '../utils/logger';

// Define types for doomscroll and outrage bait analysis
export interface DoomscrollAnalysis {
  isDoomscroll: boolean;
  doomscrollScore: number; // 0-1 scale
  doomscrollTopics: string[];
  doomscrollExplanation: string;
}

export interface OutrageBaitAnalysis {
  isOutrageBait: boolean;
  outrageBaitScore: number; // 0-1 scale
  outrageBaitTriggers: string[];
  outrageBaitExplanation: string;
}

export interface ManipulationAnalysis {
  doomscroll: DoomscrollAnalysis;
  outrageBait: OutrageBaitAnalysis;
  manipulativeTactics: string[];
  recommendedAction: string;
  educationalSummary: string;
}

// Keywords and phrases associated with doomscroll content
const DOOMSCROLL_INDICATORS = [
  // Existential threats
  'catastrophe', 'apocalypse', 'doomsday', 'extinction', 'collapse',
  'end of the world', 'devastating', 'destroyed', 'crisis', 'disaster',
  
  // Climate doom
  'climate catastrophe', 'climate disaster', 'irreversible damage',
  'point of no return', 'climate emergency',
  
  // Societal collapse
  'society collapse', 'economic crash', 'market crash', 'recession',
  'depression', 'failing economy', 'supply chain collapse',
  
  // Global threats
  'pandemic', 'outbreak', 'global crisis', 'worldwide emergency',
  'international disaster', 'nuclear', 'war', 'conflict',
  
  // Time pressure
  'running out of time', 'time is running out', 'before it\'s too late',
  'last chance', 'point of no return', 'tipping point',
];

// Keywords and phrases associated with outrage bait
const OUTRAGE_BAIT_INDICATORS = [
  // Inflammatory language
  'outrageous', 'shocking', 'disgraceful', 'disgusting', 'appalling',
  'shameful', 'unbelievable', 'scandalous', 'infuriating',
  
  // Partisan triggers
  'radical left', 'radical right', 'extreme left', 'extreme right', 
  'communist', 'socialist', 'fascist', 'nazi', 'extremist', 'woke',
  
  // Calls to action
  'fight back', 'must stop', 'stand up against', 'defend against',
  'combat', 'battle', 'war on', 'attack on', 'assault on',
  
  // Divisive framing
  'they want to', 'they\'re coming for', 'us vs them', 'destroying our',
  'taking away your', 'threat to your', 'enemy of the',
  
  // Emotional amplifiers
  'fury', 'rage', 'angry', 'furious', 'outrage', 'hatred', 'hate',
];

/**
 * Analyze text for doomscroll indicators
 */
export function analyzeDoomscroll(text: string): DoomscrollAnalysis {
  const lowerText = text.toLowerCase();
  let doomscrollScore = 0;
  let doomscrollTopics: string[] = [];
  
  // Count doomscroll indicators
  DOOMSCROLL_INDICATORS.forEach(term => {
    const regex = new RegExp(`\\b${term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      doomscrollScore += matches.length;
      doomscrollTopics.push(`${term} (${matches.length})`);
    }
  });
  
  // Normalize score to 0-1 range
  const normalizedScore = Math.min(doomscrollScore / 10, 1);
  logger.debug(`Doomscroll score: ${normalizedScore.toFixed(2)}, found ${doomscrollTopics.length} topics`);
  
  // Generate explanation based on score
  let explanation = '';
  if (normalizedScore > 0.7) {
    explanation = 'This content contains numerous apocalyptic or catastrophic themes designed to trigger anxiety and continued scrolling.';
  } else if (normalizedScore > 0.4) {
    explanation = 'This content contains moderate doomscroll elements that may contribute to anxiety.';
  } else if (normalizedScore > 0) {
    explanation = 'This content contains minimal doomscroll elements.';
  } else {
    explanation = 'No significant doomscroll content detected.';
  }
  
  return {
    isDoomscroll: normalizedScore > 0.4,
    doomscrollScore: normalizedScore,
    doomscrollTopics: doomscrollTopics.slice(0, 5), // Top 5 topics
    doomscrollExplanation: explanation
  };
}

/**
 * Analyze text for outrage bait indicators
 */
export function analyzeOutrageBait(text: string): OutrageBaitAnalysis {
  const lowerText = text.toLowerCase();
  let outrageBaitScore = 0;
  let outrageBaitTriggers: string[] = [];
  
  // Count outrage bait indicators
  OUTRAGE_BAIT_INDICATORS.forEach(term => {
    const regex = new RegExp(`\\b${term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      outrageBaitScore += matches.length;
      outrageBaitTriggers.push(`${term} (${matches.length})`);
    }
  });
  
  // Normalize score to 0-1 range
  const normalizedScore = Math.min(outrageBaitScore / 8, 1);
  logger.debug(`Outrage bait score: ${normalizedScore.toFixed(2)}, found ${outrageBaitTriggers.length} triggers`);
  
  // Generate explanation based on score
  let explanation = '';
  if (normalizedScore > 0.7) {
    explanation = 'This content uses highly inflammatory language designed to trigger outrage and emotional responses.';
  } else if (normalizedScore > 0.4) {
    explanation = 'This content contains moderate outrage-inducing elements that may manipulate emotional responses.';
  } else if (normalizedScore > 0) {
    explanation = 'This content contains minimal outrage-inducing elements.';
  } else {
    explanation = 'No significant outrage bait detected.';
  }
  
  return {
    isOutrageBait: normalizedScore > 0.4,
    outrageBaitScore: normalizedScore,
    outrageBaitTriggers: outrageBaitTriggers.slice(0, 5), // Top 5 triggers
    outrageBaitExplanation: explanation
  };
}

/**
 * Comprehensive analysis of manipulative content
 */
export function analyzeManipulativeContent(text: string): ManipulationAnalysis {
  const doomscrollAnalysis = analyzeDoomscroll(text);
  const outrageBaitAnalysis = analyzeOutrageBait(text);
  
  // Determine manipulative tactics based on analyses
  const manipulativeTactics: string[] = [];
  
  if (doomscrollAnalysis.isDoomscroll) {
    manipulativeTactics.push('Fear-mongering');
    manipulativeTactics.push('Anxiety induction');
    manipulativeTactics.push('Catastrophizing');
  }
  
  if (outrageBaitAnalysis.isOutrageBait) {
    manipulativeTactics.push('Emotional manipulation');
    manipulativeTactics.push('Tribal triggering');
    manipulativeTactics.push('Outrage cultivation');
  }
  
  // Generate recommended action
  let recommendedAction = '';
  if (doomscrollAnalysis.isDoomscroll && outrageBaitAnalysis.isOutrageBait) {
    recommendedAction = 'Consider taking a break before continuing. This content is designed to manipulate both fear and anger responses.';
  } else if (doomscrollAnalysis.isDoomscroll) {
    recommendedAction = 'Consider whether this anxiety-inducing content deserves your continued attention.';
  } else if (outrageBaitAnalysis.isOutrageBait) {
    recommendedAction = 'Take a moment to process your emotional response before reacting to this content.';
  } else {
    recommendedAction = 'This content appears to be relatively free of manipulative elements.';
  }
  
  // Generate educational summary
  const educationalSummary = generateEducationalSummary(
    doomscrollAnalysis.isDoomscroll,
    outrageBaitAnalysis.isOutrageBait
  );
  
  return {
    doomscroll: doomscrollAnalysis,
    outrageBait: outrageBaitAnalysis,
    manipulativeTactics,
    recommendedAction,
    educationalSummary
  };
}

/**
 * Generate an educational summary about manipulation tactics
 */
function generateEducationalSummary(isDoomscroll: boolean, isOutrageBait: boolean): string {
  let summary = '';
  
  if (!isDoomscroll && !isOutrageBait) {
    return 'This content appears to be relatively free of common manipulation tactics.';
  }
  
  if (isDoomscroll && isOutrageBait) {
    summary = `
      <h3>Why This Content May Be Manipulative</h3>
      <p>This content combines <strong>doomscroll tactics</strong> and <strong>outrage bait</strong>, two powerful psychological triggers:</p>
      
      <h4>Doomscroll Manipulation</h4>
      <ul>
        <li><strong>Fear Response:</strong> Triggers the amygdala, creating a state of anxiety that keeps you scrolling for resolution.</li>
        <li><strong>Negativity Bias:</strong> Exploits our natural tendency to pay more attention to threatening information.</li>
        <li><strong>Information-Seeking Behavior:</strong> Creates an artificial need to constantly check for updates about potential threats.</li>
      </ul>
      
      <h4>Outrage Bait Manipulation</h4>
      <ul>
        <li><strong>Tribal Triggers:</strong> Activates in-group/out-group dynamics to increase engagement.</li>
        <li><strong>Emotional Contagion:</strong> Anger spreads faster online than other emotions and drives more engagement.</li>
        <li><strong>Identity Reinforcement:</strong> Provides easy ways to signal group membership through shared outrage.</li>
      </ul>
      
      <p>Both tactics are commonly employed because they reliably increase user engagement, time-on-site, ad impressions, and shares.</p>
    `;
  } else if (isDoomscroll) {
    summary = `
      <h3>Why This Content May Be Manipulative</h3>
      <p>This content shows characteristics of <strong>doomscroll manipulation</strong>:</p>
      
      <h4>How Doomscroll Content Works</h4>
      <ul>
        <li><strong>Survival Instinct:</strong> Activates primitive brain responses to potential threats, keeping you vigilant.</li>
        <li><strong>Uncertainty Loop:</strong> Provides enough information to worry you, but not enough for closure, creating a cycle of continued checking.</li>
        <li><strong>Dopamine Mechanism:</strong> Each new piece of crisis information, even negative, triggers small dopamine releases that reinforce the scrolling behavior.</li>
        <li><strong>Diminished Agency:</strong> Creates a sense that threats are overwhelming but consuming content gives you control.</li>
      </ul>
      
      <p>Media and content platforms maximize this content because anxiety-inducing material drives higher engagement metrics, longer session times, and more frequent returns to the platform.</p>
    `;
  } else if (isOutrageBait) {
    summary = `
      <h3>Why This Content May Be Manipulative</h3>
      <p>This content shows characteristics of <strong>outrage bait</strong>:</p>
      
      <h4>How Outrage Bait Works</h4>
      <ul>
        <li><strong>Moral Elevation:</strong> Provides an easy way to feel morally superior by expressing outrage.</li>
        <li><strong>Social Currency:</strong> Creates shareable content that signals virtue and tribal membership.</li>
        <li><strong>Cognitive Shortcuts:</strong> Uses emotional framing to bypass critical thinking and nuanced analysis.</li>
        <li><strong>Attention Hijacking:</strong> Strong emotional reactions capture and hold attention better than neutral information.</li>
      </ul>
      
      <p>Content creators and platforms often amplify outrage-inducing material because anger drives significantly more engagement, shares, and comments than balanced reporting.</p>
    `;
  }
  
  return summary;
} 