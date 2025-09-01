import json
import uuid
import random
import os
from datetime import datetime
from typing import List, Optional, Dict, Any
from models.practice_models import *
from models.reading import ReadingService
from models.spreads import *

class PracticeService:
    def __init__(self):
        self.reading_service = ReadingService()
        self.scenarios = self._load_scenarios()
        self.client_profiles = self._load_client_profiles()
        self.evaluation_rubric = self._load_evaluation_rubric()
        self.card_data = self._load_card_data()
        self.active_sessions: Dict[str, PracticeSession] = {}
        self.user_progress: Dict[str, ProgressTracking] = {}
        
    def _load_scenarios(self) -> List[PracticeScenario]:
        """Load practice scenarios from JSON file"""
        try:
            config_path = os.path.join(os.path.dirname(__file__), "..", "config", "practice_scenarios.json")
            with open(config_path, "r") as f:
                data = json.load(f)
            return [PracticeScenario(**scenario) for scenario in data["scenarios"]]
        except Exception as e:
            print(f"Error loading scenarios: {e}")
            return []
    
    def _load_client_profiles(self) -> List[ClientProfile]:
        """Load client profiles from JSON file"""
        try:
            config_path = os.path.join(os.path.dirname(__file__), "..", "config", "practice_scenarios.json")
            with open(config_path, "r") as f:
                data = json.load(f)
            return [ClientProfile(**profile) for profile in data["client_profiles"]]
        except Exception as e:
            print(f"Error loading client profiles: {e}")
            return []
    
    def _load_evaluation_rubric(self) -> Dict[str, Any]:
        """Load evaluation rubric from JSON file"""
        try:
            config_path = os.path.join(os.path.dirname(__file__), "..", "config", "evaluation_rubric.json")
            with open(config_path, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading evaluation rubric: {e}")
            return {}
    
    def _load_card_data(self) -> Dict[str, Any]:
        """Load card image data from JSON file"""
        try:
            with open("static/tarot-images.json", "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading card data: {e}")
            return {"cards": []}
    
    def _get_card_image_url(self, card_name: str) -> str:
        """Get the image URL for a card by name"""
        for card_entry in self.card_data.get("cards", []):
            if card_entry.get("name") == card_name:
                return f"/static/cards_wikipedia/{card_entry.get('img', 'placeholder.jpg')}"
        return "/static/cards_wikipedia/placeholder.jpg"
    
    def _load_spreads_mapping(self) -> Dict[str, Any]:
        """Load spreads configuration for card drawing"""
        try:
            config_path = os.path.join(os.path.dirname(__file__), "..", "config", "spreads-config.json")
            with open(config_path, "r") as f:
                config = json.load(f)
            
            # Map card count to spread class
            card_count_to_class = {
                1: SingleCardSpread,
                3: ThreeCardSpread, 
                4: FourCardDecisionSpread,
                5: FiveCardCrossSpread,
                6: SixCardRelationshipSpread,
                7: SevenCardHorseshoeSpread,
                10: CelticCrossSpread
            }
            
            spreads_mapping = {}
            for spread in config["spreads"]:
                spread_id = spread["id"]
                layout = config["layouts"][spread["layout"]]
                card_count = len(layout["positions"])
                
                if card_count in card_count_to_class:
                    spreads_mapping[spread_id] = {
                        "class": card_count_to_class[card_count],
                        "positions": [pos["name"] for pos in spread["positions"]]
                    }
            
            return spreads_mapping
        except Exception as e:
            print(f"Error loading spreads mapping: {e}")
            return {}
    
    def get_available_scenarios(self, 
                              difficulty: Optional[DifficultyLevel] = None,
                              category: Optional[ScenarioCategory] = None) -> List[PracticeScenario]:
        """Get available scenarios, optionally filtered by difficulty and category"""
        scenarios = self.scenarios
        
        if difficulty:
            scenarios = [s for s in scenarios if s.difficulty_level == difficulty]
        
        if category:
            scenarios = [s for s in scenarios if s.category == category]
        
        return scenarios
    
    def start_practice_session(self, user_id: str, 
                             difficulty_preference: Optional[DifficultyLevel] = None,
                             category_preference: Optional[ScenarioCategory] = None,
                             scenario_id: Optional[str] = None) -> StartPracticeResponse:
        """Start a new practice session with a specified or random scenario and client"""
        
        if scenario_id:
            # Use specific scenario if provided
            scenario = None
            for s in self.scenarios:
                if s.id == scenario_id:
                    scenario = s
                    break
            
            if not scenario:
                raise ValueError(f"Scenario {scenario_id} not found")
        else:
            # Filter scenarios based on preferences for random selection
            available_scenarios = self.get_available_scenarios(difficulty_preference, category_preference)
            
            if not available_scenarios:
                # Fallback to all scenarios if none match preferences
                available_scenarios = self.scenarios
            
            # Select random scenario
            scenario = random.choice(available_scenarios)
        
        # Find the explicitly linked client profile
        client_profile = None
        for profile in self.client_profiles:
            if profile.id == scenario.client_id:
                client_profile = profile
                break
        
        if not client_profile:
            # Fallback to random if no matching client found (shouldn't happen with proper data)
            print(f"Warning: No client profile found for scenario {scenario.id} with client_id {scenario.client_id}")
            client_profile = random.choice(self.client_profiles)
        
        # Create session
        session_id = str(uuid.uuid4())
        session = PracticeSession(
            session_id=session_id,
            user_id=user_id,
            timestamp=datetime.now(),
            client_profile=client_profile,
            scenario=scenario,
            selected_spread="",  # Will be set when user selects spread
            cards_drawn=[]
        )
        
        self.active_sessions[session_id] = session
        
        return StartPracticeResponse(
            session_id=session_id,
            client_profile=client_profile,
            scenario=scenario,
            suggested_spreads=scenario.suggested_spreads
        )
    
    def select_spread_and_draw_cards(self, session_id: str, selected_spread: str) -> SelectSpreadResponse:
        """Select spread for session and draw cards"""
        if session_id not in self.active_sessions:
            raise ValueError(f"Session {session_id} not found")
        
        session = self.active_sessions[session_id]
        session.selected_spread = selected_spread
        
        # Load spreads mapping and draw cards
        spreads_mapping = self._load_spreads_mapping()
        
        if selected_spread not in spreads_mapping:
            raise ValueError(f"Spread {selected_spread} not supported")
        
        spread_info = spreads_mapping[selected_spread]
        spread_class = spread_info["class"]
        position_names = spread_info["positions"]
        
        # Create spread instance and perform reading
        spread = spread_class()
        reading = self.reading_service.perform_reading(
            question=session.scenario.primary_question,
            spread=spread,
            shuffle_count=7,
            include_date=False
        )
        
        # Convert to drawn cards format
        cards_drawn = []
        for i, drawn_card in enumerate(reading.cards):
            position_name = position_names[i] if i < len(position_names) else f"Position {i+1}"
            
            card = DrawnCard(
                card_name=drawn_card.card.name,
                position=position_name,
                reversed=drawn_card.reversed,
                image_url=self._get_card_image_url(drawn_card.card.name)
            )
            cards_drawn.append(card)
        
        session.cards_drawn = cards_drawn
        
        return SelectSpreadResponse(
            session_id=session_id,
            cards_drawn=cards_drawn
        )
    
    def submit_interpretation(self, session_id: str, interpretation: UserInterpretation) -> SubmitInterpretationResponse:
        """Submit user interpretation and get AI evaluation"""
        if session_id not in self.active_sessions:
            raise ValueError(f"Session {session_id} not found")
        
        session = self.active_sessions[session_id]
        session.user_interpretation = interpretation
        
        # Generate AI evaluation
        ai_evaluation = self._evaluate_interpretation(session)
        session.ai_evaluation = ai_evaluation
        
        # Mark session as completed
        session.session_metadata.completed = True
        
        # Update user progress
        self._update_user_progress(session)
        
        return SubmitInterpretationResponse(
            session_id=session_id,
            ai_evaluation=ai_evaluation,
            session_completed=True
        )
    
    def _evaluate_interpretation(self, session: PracticeSession) -> AIEvaluation:
        """Generate AI evaluation of user interpretation"""
        # This is a simplified evaluation - in production, this would use the LLM
        # For now, we'll create a basic rule-based evaluation
        
        interpretation = session.user_interpretation
        scenario = session.scenario
        cards = session.cards_drawn
        
        # Calculate scores based on simple heuristics
        criteria_scores = CriteriaScores(
            card_knowledge=self._score_card_knowledge(interpretation, cards),
            position_relevance=self._score_position_relevance(interpretation, cards),
            reading_coherence=self._score_coherence(interpretation),
            empathy_communication=self._score_empathy(interpretation, scenario),
            practical_guidance=self._score_practical_guidance(interpretation),
            ethical_considerations=self._score_ethics(interpretation),
            intuitive_insight=self._score_intuition(interpretation)
        )
        
        # Calculate weighted overall score
        weights = {
            'card_knowledge': 0.20,
            'position_relevance': 0.18,
            'reading_coherence': 0.16,
            'empathy_communication': 0.15,
            'practical_guidance': 0.12,
            'ethical_considerations': 0.10,
            'intuitive_insight': 0.09
        }
        
        overall_score = (
            criteria_scores.card_knowledge * weights['card_knowledge'] +
            criteria_scores.position_relevance * weights['position_relevance'] +
            criteria_scores.reading_coherence * weights['reading_coherence'] +
            criteria_scores.empathy_communication * weights['empathy_communication'] +
            criteria_scores.practical_guidance * weights['practical_guidance'] +
            criteria_scores.ethical_considerations * weights['ethical_considerations'] +
            criteria_scores.intuitive_insight * weights['intuitive_insight']
        )
        
        # Generate feedback
        strengths, improvements, next_steps = self._generate_feedback(criteria_scores, scenario.difficulty_level)
        
        return AIEvaluation(
            overall_score=overall_score,
            criteria_scores=criteria_scores,
            strengths=strengths,
            areas_for_improvement=improvements,
            missed_opportunities=[],
            alternative_interpretations=[],
            next_steps=next_steps
        )
    
    def _score_card_knowledge(self, interpretation: UserInterpretation, cards: List[DrawnCard]) -> float:
        """Score card knowledge based on interpretation quality"""
        # Basic scoring - checks if cards are mentioned and interpreted
        score = 70.0  # Base score
        
        if len(interpretation.card_interpretations) == len(cards):
            score += 15.0
        
        # Check if interpretations are substantial (not just one word)
        avg_length = sum(len(ci.interpretation) for ci in interpretation.card_interpretations) / len(interpretation.card_interpretations)
        if avg_length > 100:
            score += 15.0
        elif avg_length > 50:
            score += 10.0
        
        return min(score, 100.0)
    
    def _score_position_relevance(self, interpretation: UserInterpretation, cards: List[DrawnCard]) -> float:
        """Score how well positions are integrated"""
        score = 65.0
        
        # Check if position meanings are discussed
        for card_interp in interpretation.card_interpretations:
            if card_interp.connection_to_question:
                score += 5.0
        
        return min(score, 100.0)
    
    def _score_coherence(self, interpretation: UserInterpretation) -> float:
        """Score reading coherence and synthesis"""
        score = 60.0
        
        if interpretation.synthesis and len(interpretation.synthesis) > 100:
            score += 25.0
        elif interpretation.synthesis:
            score += 15.0
        
        if len(interpretation.overall_reading) > 200:
            score += 15.0
        
        return min(score, 100.0)
    
    def _score_empathy(self, interpretation: UserInterpretation, scenario: PracticeScenario) -> float:
        """Score empathy and communication"""
        score = 70.0
        
        # Look for empathetic language
        empathy_words = ['understand', 'feel', 'difficult', 'challenging', 'support', 'compassion']
        text = interpretation.overall_reading.lower()
        
        empathy_count = sum(1 for word in empathy_words if word in text)
        score += min(empathy_count * 5, 20)
        
        # Adjust for emotional intensity
        if scenario.emotional_intensity == EmotionalIntensity.HIGH or scenario.emotional_intensity == EmotionalIntensity.CRISIS:
            if any(word in text for word in ['sorry', 'pain', 'healing']):
                score += 10
        
        return min(score, 100.0)
    
    def _score_practical_guidance(self, interpretation: UserInterpretation) -> float:
        """Score practical guidance provided"""
        score = 65.0
        
        if interpretation.advice_given and len(interpretation.advice_given) > 50:
            score += 20.0
        
        # Look for actionable language
        action_words = ['consider', 'try', 'practice', 'focus', 'work on', 'steps']
        text = (interpretation.advice_given or "").lower()
        
        action_count = sum(1 for word in action_words if word in text)
        score += min(action_count * 3, 15)
        
        return min(score, 100.0)
    
    def _score_ethics(self, interpretation: UserInterpretation) -> float:
        """Score ethical considerations"""
        # Basic ethical score - no harmful predictions, empowers client
        score = 80.0
        
        text = interpretation.overall_reading.lower()
        
        # Deduct for overly predictive language
        prediction_words = ['will happen', 'definitely', 'certainly', 'fate', 'destined']
        for word in prediction_words:
            if word in text:
                score -= 10
        
        # Add for empowering language
        empowering_words = ['choice', 'power', 'decision', 'control', 'opportunity']
        for word in empowering_words:
            if word in text:
                score += 2
        
        return max(min(score, 100.0), 60.0)
    
    def _score_intuition(self, interpretation: UserInterpretation) -> float:
        """Score intuitive insights"""
        score = 70.0
        
        # Look for personal insights beyond basic card meanings
        insight_words = ['sense', 'feel', 'intuition', 'insight', 'deeper', 'beneath']
        text = interpretation.overall_reading.lower()
        
        insight_count = sum(1 for word in insight_words if word in text)
        score += min(insight_count * 5, 20)
        
        return min(score, 100.0)
    
    def _generate_feedback(self, scores: CriteriaScores, difficulty: DifficultyLevel) -> tuple:
        """Generate feedback based on scores"""
        strengths = []
        improvements = []
        next_steps = []
        
        # Identify strengths (scores > 80)
        if scores.card_knowledge > 80:
            strengths.append("Strong card knowledge foundation")
        if scores.empathy_communication > 80:
            strengths.append("Compassionate communication style")
        if scores.reading_coherence > 80:
            strengths.append("Excellent narrative flow")
        if scores.practical_guidance > 80:
            strengths.append("Good practical guidance")
        
        # Identify improvement areas (scores < 70)
        if scores.card_knowledge < 70:
            improvements.append("Study card meanings more thoroughly")
            next_steps.append("Practice with card meaning flashcards")
        if scores.position_relevance < 70:
            improvements.append("Integrate position meanings more fully")
            next_steps.append("Study spread position meanings")
        if scores.reading_coherence < 70:
            improvements.append("Develop stronger narrative coherence")
            next_steps.append("Practice storytelling with cards")
        if scores.empathy_communication < 70:
            improvements.append("Enhance empathetic language")
            next_steps.append("Practice active listening techniques")
        
        # Add default next steps
        if not next_steps:
            next_steps.append("Continue practicing with diverse scenarios")
        
        return strengths, improvements, next_steps
    
    def _update_user_progress(self, session: PracticeSession):
        """Update user progress tracking"""
        user_id = session.user_id
        
        if user_id not in self.user_progress:
            self.user_progress[user_id] = ProgressTracking(user_id=user_id)
        
        progress = self.user_progress[user_id]
        
        # Update statistics
        progress.statistics.total_sessions += 1
        
        # Update sessions by difficulty
        if session.scenario.difficulty_level == DifficultyLevel.BEGINNER:
            progress.statistics.sessions_by_difficulty.beginner += 1
        elif session.scenario.difficulty_level == DifficultyLevel.INTERMEDIATE:
            progress.statistics.sessions_by_difficulty.intermediate += 1
        elif session.scenario.difficulty_level == DifficultyLevel.ADVANCED:
            progress.statistics.sessions_by_difficulty.advanced += 1
        elif session.scenario.difficulty_level == DifficultyLevel.EXPERT:
            progress.statistics.sessions_by_difficulty.expert += 1
        
        # Update average scores
        if session.ai_evaluation:
            if progress.statistics.average_scores.overall is None:
                progress.statistics.average_scores.overall = session.ai_evaluation.overall_score
            else:
                # Simple running average
                total = progress.statistics.total_sessions
                current_avg = progress.statistics.average_scores.overall
                new_score = session.ai_evaluation.overall_score
                progress.statistics.average_scores.overall = ((current_avg * (total - 1)) + new_score) / total
    
    def get_user_sessions(self, user_id: str) -> List[PracticeSession]:
        """Get all completed sessions for a user"""
        return [session for session in self.active_sessions.values() 
                if session.user_id == user_id and session.session_metadata.completed]
    
    def get_user_progress(self, user_id: str) -> Optional[ProgressTracking]:
        """Get progress tracking for a user"""
        return self.user_progress.get(user_id)
    
    def get_session(self, session_id: str) -> Optional[PracticeSession]:
        """Get a specific session"""
        return self.active_sessions.get(session_id)
    
