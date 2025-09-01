"""
Question Type Classifier - Piece 3 of Context Retrieval Architecture

Classifies tarot questions into categories (love, career, spiritual, etc.) 
to retrieve the most relevant card interpretations.
"""

import re
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum


class QuestionType(Enum):
    """Supported question types that match card JSON contexts"""
    LOVE = "love"
    CAREER = "career"
    SPIRITUAL = "spiritual"
    FINANCIAL = "financial"
    HEALTH = "health"
    GENERAL = "general"


@dataclass
class ClassificationResult:
    """Result of question classification"""
    primary_type: QuestionType
    confidence: float
    secondary_type: Optional[QuestionType] = None
    detected_keywords: List[str] = None


class QuestionClassifier:
    """Classifies tarot questions into contextual categories"""
    
    def __init__(self):
        # Keywords for each question type - organized by strength
        self.classification_keywords = {
            QuestionType.LOVE: {
                "strong": [
                    "love", "relationship", "romance", "dating", "partner", "boyfriend", 
                    "girlfriend", "husband", "wife", "marriage", "soulmate", "romantic",
                    "crush", "attraction", "intimacy", "breakup", "divorce", "wedding"
                ],
                "medium": [
                    "heart", "feelings", "emotion", "connection", "together", "alone",
                    "commitment", "trust", "passion", "chemistry", "affection"
                ],
                "weak": [
                    "someone", "person", "they", "relationship"
                ]
            },
            
            QuestionType.CAREER: {
                "strong": [
                    "job", "career", "work", "employment", "boss", "colleague", "workplace",
                    "business", "profession", "promotion", "interview", "resign", "quit",
                    "salary", "raise", "fired", "hired", "company", "office", "project",
                    "entrepreneur", "startup", "freelance", "client", "customer"
                ],
                "medium": [
                    "success", "achievement", "goal", "ambition", "opportunity", "skill",
                    "leadership", "management", "team", "responsibility", "performance"
                ],
                "weak": [
                    "future", "path", "direction", "choice"
                ]
            },
            
            QuestionType.SPIRITUAL: {
                "strong": [
                    "spiritual", "soul", "purpose", "meaning", "divine", "god", "universe",
                    "meditation", "prayer", "awakening", "enlightenment", "consciousness",
                    "intuition", "psychic", "mystical", "sacred", "blessing", "guidance",
                    "faith", "belief", "destiny", "karma", "past life", "spirit guide"
                ],
                "medium": [
                    "higher", "deeper", "wisdom", "truth", "inner", "growth", "healing",
                    "transformation", "journey", "path", "calling", "mission"
                ],
                "weak": [
                    "energy", "vibration", "sign", "message"
                ]
            },
            
            QuestionType.FINANCIAL: {
                "strong": [
                    "money", "financial", "finance", "income", "salary", "wealth", "rich",
                    "poor", "debt", "loan", "mortgage", "investment", "savings", "budget",
                    "expense", "cost", "price", "profit", "loss", "bank", "credit", "cash",
                    "dollar", "pay", "payment", "afford", "broke", "bankruptcy"
                ],
                "medium": [
                    "security", "stability", "resources", "material", "abundance", "prosperity",
                    "success", "opportunity", "business", "value", "worth"
                ],
                "weak": [
                    "support", "foundation", "practical"
                ]
            },
            
            QuestionType.HEALTH: {
                "strong": [
                    "health", "illness", "sick", "disease", "doctor", "medical", "hospital",
                    "medicine", "treatment", "therapy", "healing", "wellness", "fitness",
                    "exercise", "diet", "nutrition", "weight", "pain", "injury", "surgery",
                    "mental health", "depression", "anxiety", "stress", "tired", "energy"
                ],
                "medium": [
                    "body", "physical", "wellbeing", "recovery", "strength", "vitality",
                    "balance", "rest", "sleep", "fatigue", "exhaustion"
                ],
                "weak": [
                    "feel", "feeling", "better", "worse", "improve"
                ]
            }
        }
        
        # Compile regex patterns for efficiency
        self.compiled_patterns = self._compile_patterns()
    
    def _compile_patterns(self) -> Dict[QuestionType, Dict[str, re.Pattern]]:
        """Compile regex patterns for each keyword category"""
        patterns = {}
        
        for q_type, strengths in self.classification_keywords.items():
            patterns[q_type] = {}
            for strength, keywords in strengths.items():
                # Create word boundary pattern for each keyword
                pattern_str = r'\b(?:' + '|'.join(re.escape(kw) for kw in keywords) + r')\b'
                patterns[q_type][strength] = re.compile(pattern_str, re.IGNORECASE)
        
        return patterns
    
    def classify_question(self, question: str) -> ClassificationResult:
        """
        Classify a question into a primary type with confidence score
        
        Args:
            question: The tarot question to classify
            
        Returns:
            ClassificationResult with type, confidence, and detected keywords
        """
        if not question or not question.strip():
            return ClassificationResult(
                primary_type=QuestionType.GENERAL,
                confidence=1.0,
                detected_keywords=[]
            )
        
        # Clean the question
        clean_question = self._clean_question(question)
        
        # Score each question type
        scores = self._score_question_types(clean_question)
        
        # Find best match
        best_type, best_score = max(scores.items(), key=lambda x: x[1]['total'])
        
        # Determine confidence based on score and gap from second place
        sorted_scores = sorted(scores.values(), key=lambda x: x['total'], reverse=True)
        confidence = self._calculate_confidence(sorted_scores)
        
        # Find secondary type if applicable
        secondary_type = None
        if len(sorted_scores) > 1 and sorted_scores[1]['total'] > 0.3:
            for q_type, score_data in scores.items():
                if score_data['total'] == sorted_scores[1]['total']:
                    secondary_type = q_type
                    break
        
        return ClassificationResult(
            primary_type=best_type,
            confidence=confidence,
            secondary_type=secondary_type,
            detected_keywords=best_score['keywords']
        )
    
    def _clean_question(self, question: str) -> str:
        """Clean and normalize the question text"""
        # Convert to lowercase, remove extra whitespace
        cleaned = re.sub(r'\s+', ' ', question.lower().strip())
        
        # Remove common question words that don't add context
        noise_words = [
            'what', 'when', 'where', 'why', 'how', 'who', 'which', 'will', 'would',
            'could', 'should', 'can', 'do', 'does', 'did', 'is', 'are', 'was', 'were',
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'about', 'please', 'tell', 'me', 'my', 'i', 'you'
        ]
        
        # Keep the original for pattern matching, but create a version without noise
        words = cleaned.split()
        content_words = [w for w in words if w not in noise_words and len(w) > 2]
        
        return cleaned  # Return original for full pattern matching
    
    def _score_question_types(self, question: str) -> Dict[QuestionType, Dict]:
        """Score each question type based on keyword matches"""
        scores = {}
        
        for q_type in QuestionType:
            if q_type == QuestionType.GENERAL:
                scores[q_type] = {'total': 0.0, 'keywords': []}
                continue
                
            type_score = 0.0
            found_keywords = []
            
            # Check patterns for this type
            patterns = self.compiled_patterns.get(q_type, {})
            
            # Strong keywords (weight: 1.0)
            if 'strong' in patterns:
                matches = patterns['strong'].findall(question)
                if matches:
                    type_score += len(matches) * 1.0
                    found_keywords.extend(matches)
            
            # Medium keywords (weight: 0.6)
            if 'medium' in patterns:
                matches = patterns['medium'].findall(question)
                if matches:
                    type_score += len(matches) * 0.6
                    found_keywords.extend(matches)
            
            # Weak keywords (weight: 0.3)
            if 'weak' in patterns:
                matches = patterns['weak'].findall(question)
                if matches:
                    type_score += len(matches) * 0.3
                    found_keywords.extend(matches)
            
            scores[q_type] = {
                'total': type_score,
                'keywords': found_keywords
            }
        
        # If no type scored above threshold, default to GENERAL
        max_score = max((data['total'] for data in scores.values()), default=0.0)
        if max_score < 0.5:  # Minimum threshold for classification
            scores[QuestionType.GENERAL]['total'] = 1.0
        
        return scores
    
    def _calculate_confidence(self, sorted_scores: List[Dict]) -> float:
        """Calculate confidence based on score distribution"""
        if not sorted_scores or sorted_scores[0]['total'] == 0:
            return 0.5  # Low confidence for GENERAL
        
        top_score = sorted_scores[0]['total']
        
        # High confidence if clear winner
        if top_score >= 2.0:
            return 0.95
        elif top_score >= 1.5:
            return 0.85
        elif top_score >= 1.0:
            return 0.75
        
        # Moderate confidence if there's a gap from second place
        if len(sorted_scores) > 1:
            second_score = sorted_scores[1]['total']
            gap = top_score - second_score
            
            if gap >= 0.5:
                return 0.7
            elif gap >= 0.3:
                return 0.6
            else:
                return 0.5  # Low confidence when scores are close
        
        return 0.6  # Moderate confidence for single match


# Test function
def test_question_classifier():
    """Test the question classifier with various examples"""
    classifier = QuestionClassifier()
    
    test_questions = [
        "Will I find love this year?",
        "Should I take this new job offer?",
        "What is my spiritual purpose in life?",
        "How can I improve my financial situation?",
        "What do I need to know about my health?",
        "Will my relationship with Sarah work out?",
        "Should I start my own business?",
        "How can I connect with my higher self?",
        "When will I get out of debt?",
        "What's causing my anxiety and stress?",
        "What should I focus on today?",  # General
        "Am I on the right path?",  # Could be spiritual or general
        "Should I move to a new city for this job opportunity?",  # Career + general
        "How can I heal my broken heart after this breakup?"  # Love + health/healing
    ]
    
    print("🧪 Testing Question Classification:")
    print("=" * 60)
    
    for question in test_questions:
        result = classifier.classify_question(question)
        
        print(f"\nQuestion: '{question}'")
        print(f"Type: {result.primary_type.value} (confidence: {result.confidence:.2f})")
        if result.secondary_type:
            print(f"Secondary: {result.secondary_type.value}")
        if result.detected_keywords:
            print(f"Keywords: {', '.join(result.detected_keywords)}")
        print("-" * 40)
    
    return classifier


if __name__ == "__main__":
    test_question_classifier()