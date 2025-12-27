/**
 * Fallback Briefing Data
 * 
 * High-quality mock data used when the backend API is unavailable.
 * This ensures the app never shows a blank screen or infinite loading.
 */

export interface FallbackArticle {
  topic: string;
  icon: string;
  article: {
    title: string;
    url: string;
    source: string;
    publishDate: string;
    author: string;
    content: string;
  };
  analysis: {
    keySentences: Array<{
      sentence: string;
      manipulationTechniques: string[];
      biasIndicators: string[];
    }>;
    manipulationAnalysis: {
      logicalFallacies: Array<{
        type: string;
        location: string;
        explanation: string;
      }>;
    };
    overallAssessment: {
      reliabilityScore: number;
    };
  };
}

export interface FallbackBriefing {
  generatedAt: string;
  version: string;
  isOffline: boolean;
  topics: {
    [key: string]: FallbackArticle;
  };
}

export const fallbackBriefing: FallbackBriefing = {
  generatedAt: new Date().toISOString(),
  version: "1.0-fallback",
  isOffline: true,
  topics: {
    ukraine: {
      topic: "Ukraine Conflict",
      icon: "🇺🇦",
      article: {
        title: "Western Nations Announce New Military Aid Package Amid Stalemate",
        url: "https://example.com/ukraine-aid",
        source: "Reuters",
        publishDate: new Date().toISOString(),
        author: "Staff Reporter",
        content: `<p>Western allies have announced a new comprehensive military aid package for Ukraine as the conflict enters its third year with neither side making significant territorial gains.</p>
        
<p>The package includes advanced air defense systems, artillery ammunition, and armored vehicles. Defense officials emphasized the importance of sustained support while acknowledging the challenging battlefield conditions.</p>

<p>"We remain committed to supporting Ukraine's defense of its sovereignty," stated a senior defense official who spoke on condition of anonymity. "However, we must be realistic about the timeline and the resources required."</p>

<p>Military analysts suggest the announcement comes at a critical juncture, with both sides preparing for potential spring offensives. The aid is expected to bolster defensive capabilities rather than enable major territorial advances.</p>

<p>Critics have questioned whether continued military support without a diplomatic track can lead to a sustainable resolution. Peace advocacy groups have called for renewed emphasis on negotiation alongside military assistance.</p>`
      },
      analysis: {
        keySentences: [
          {
            sentence: "We remain committed to supporting Ukraine's defense",
            manipulationTechniques: ["Appeal to Loyalty"],
            biasIndicators: ["Pro-Western framing"]
          }
        ],
        manipulationAnalysis: {
          logicalFallacies: [
            {
              type: "Appeal to Authority",
              location: "senior defense official who spoke on condition of anonymity",
              explanation: "Anonymous sources make claims difficult to verify while lending institutional credibility."
            }
          ]
        },
        overallAssessment: {
          reliabilityScore: 72
        }
      }
    },
    
    gaza: {
      topic: "Gaza Crisis",
      icon: "🕊️",
      article: {
        title: "Humanitarian Organizations Report Critical Shortages as Conflict Continues",
        url: "https://example.com/gaza-humanitarian",
        source: "Associated Press",
        publishDate: new Date().toISOString(),
        author: "Middle East Correspondent",
        content: `<p>International humanitarian organizations are reporting critical shortages of food, medicine, and clean water in Gaza as the ongoing conflict disrupts supply chains and damages infrastructure.</p>

<p>The United Nations has described the situation as a "humanitarian catastrophe" with over two million civilians affected. Aid convoys have faced significant delays and restrictions in reaching those most in need.</p>

<p>Medical facilities are operating at severely reduced capacity, with doctors reporting shortages of essential supplies including anesthetics and antibiotics. The World Health Organization has called for immediate action to prevent a public health crisis.</p>

<p>"Every day we delay means more preventable deaths," said a WHO spokesperson. "The civilian population is bearing the brunt of this conflict."</p>

<p>Diplomatic efforts continue with multiple nations calling for a humanitarian pause to allow aid delivery. However, negotiations have yet to produce concrete results as both parties maintain their positions.</p>`
      },
      analysis: {
        keySentences: [
          {
            sentence: "humanitarian catastrophe",
            manipulationTechniques: ["Loaded Language"],
            biasIndicators: ["Emotional framing"]
          }
        ],
        manipulationAnalysis: {
          logicalFallacies: [
            {
              type: "Appeal to Emotion",
              location: "Every day we delay means more preventable deaths",
              explanation: "While factually grounded, this framing prioritizes emotional response over analytical assessment of complex factors."
            }
          ]
        },
        overallAssessment: {
          reliabilityScore: 78
        }
      }
    },
    
    epstein: {
      topic: "Epstein Documents",
      icon: "📄",
      article: {
        title: "Newly Released Documents Reveal Extent of Elite Network Connections",
        url: "https://example.com/epstein-documents",
        source: "New York Times",
        publishDate: new Date().toISOString(),
        author: "Investigative Team",
        content: `<p>Recently unsealed court documents have provided new details about the extensive network of connections maintained by the late financier Jeffrey Epstein, raising fresh questions about accountability and institutional oversight.</p>

<p>The documents, released as part of ongoing civil litigation, include flight logs, correspondence, and deposition transcripts. Legal experts note that being named in the documents does not imply wrongdoing, as many contacts were professional or social in nature.</p>

<p>Several high-profile individuals have issued statements distancing themselves from Epstein's criminal activities. Attorneys representing various parties have emphasized the importance of distinguishing between association and complicity.</p>

<p>Advocacy groups for survivors of trafficking have called for continued investigation and accountability. "These documents represent a step toward transparency, but there is still much work to be done," said a representative from a survivor advocacy organization.</p>

<p>The release has reignited public debate about wealth, power, and the justice system's ability to hold influential individuals accountable.</p>`
      },
      analysis: {
        keySentences: [
          {
            sentence: "being named in the documents does not imply wrongdoing",
            manipulationTechniques: ["Preemptive Defense"],
            biasIndicators: ["Protective framing for named individuals"]
          }
        ],
        manipulationAnalysis: {
          logicalFallacies: [
            {
              type: "False Equivalence",
              location: "distinguishing between association and complicity",
              explanation: "While legally accurate, this framing can minimize the significance of documented connections without full context."
            }
          ]
        },
        overallAssessment: {
          reliabilityScore: 68
        }
      }
    },
    
    diseases: {
      topic: "Disease Outbreaks",
      icon: "🦠",
      article: {
        title: "Health Officials Monitor Multiple Respiratory Illness Clusters",
        url: "https://example.com/disease-monitoring",
        source: "CDC / WHO Joint Report",
        publishDate: new Date().toISOString(),
        author: "Health Desk",
        content: `<p>Public health officials are actively monitoring several clusters of respiratory illness across different regions, though current data suggests no cause for widespread alarm among the general population.</p>

<p>The Centers for Disease Control and Prevention has emphasized the importance of routine precautions including hand hygiene and staying home when symptomatic. Surveillance systems established during the COVID-19 pandemic continue to provide early warning capabilities.</p>

<p>"We are in a much better position to detect and respond to emerging threats than we were five years ago," noted a senior epidemiologist. "Our monitoring systems are working as intended."</p>

<p>Healthcare facilities report typical seasonal increases in respiratory cases, consistent with historical patterns. Vaccination rates for influenza and COVID-19 remain lower than recommended levels, particularly among vulnerable populations.</p>

<p>Experts recommend that individuals with underlying health conditions consult their healthcare providers about appropriate preventive measures. No travel restrictions or emergency measures have been implemented.</p>`
      },
      analysis: {
        keySentences: [
          {
            sentence: "no cause for widespread alarm",
            manipulationTechniques: ["Reassurance Language"],
            biasIndicators: ["Minimization tendency"]
          }
        ],
        manipulationAnalysis: {
          logicalFallacies: [
            {
              type: "Appeal to Authority",
              location: "a senior epidemiologist",
              explanation: "Expert opinions are valuable but should be weighed against transparency about uncertainty and data limitations."
            }
          ]
        },
        overallAssessment: {
          reliabilityScore: 82
        }
      }
    },
    
    trump: {
      topic: "Trump Legal Cases",
      icon: "⚖️",
      article: {
        title: "Multiple Court Proceedings Continue Amid Campaign Activities",
        url: "https://example.com/trump-legal",
        source: "Politico",
        publishDate: new Date().toISOString(),
        author: "Legal Affairs Correspondent",
        content: `<p>Former President Donald Trump faces a complex legal landscape as multiple criminal and civil cases proceed through various court systems while he maintains an active campaign schedule.</p>

<p>Legal experts note the unprecedented nature of a former president facing criminal prosecution while seeking reelection. Constitutional scholars have debated the implications for the electoral process and the rule of law.</p>

<p>Trump's legal team has pursued various strategies including motions to dismiss, claims of presidential immunity, and venue challenges. The former president has characterized the prosecutions as politically motivated, a claim disputed by prosecutors and legal analysts.</p>

<p>"These cases will set important precedents regardless of their outcomes," observed a constitutional law professor. "The intersection of criminal law and presidential politics is uncharted territory."</p>

<p>Polling suggests the legal proceedings have had complex effects on public opinion, with supporters viewing them as persecution and critics seeing them as accountability. The electoral implications remain uncertain as cases proceed through appeals and trial processes.</p>`
      },
      analysis: {
        keySentences: [
          {
            sentence: "politically motivated, a claim disputed by prosecutors",
            manipulationTechniques: ["Both-sides framing"],
            biasIndicators: ["Neutrality through opposition"]
          }
        ],
        manipulationAnalysis: {
          logicalFallacies: [
            {
              type: "False Balance",
              location: "supporters viewing them as persecution and critics seeing them as accountability",
              explanation: "Presenting both perspectives as equally valid without weighing evidence can obscure factual distinctions."
            }
          ]
        },
        overallAssessment: {
          reliabilityScore: 65
        }
      }
    }
  }
};

export default fallbackBriefing;

