import { useState, useEffect } from 'react'
import axios from 'axios'
import type { SpreadsConfig } from '../types/spreads'

interface CardInfo {
  name: string;
  position: string;
  reversed: boolean;
  image_url: string;
}

export function useCardData() {
  const [interpretations, setInterpretations] = useState(null)
  const [enhancedCards, setEnhancedCards] = useState(null)
  const [spreadsConfig, setSpreadsConfig] = useState<SpreadsConfig | null>(null)
  const [availableSpreads, setAvailableSpreads] = useState<{id: string, name: string, category: string}[]>([])

  // Category colors for spread labels
  const getCategoryColor = (category: string) => {
    const colors = {
      'simple': 'bg-green-500/20 text-green-300 border-green-500/30',
      'timeline': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'decision': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      'relationship': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      'wellness': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'comprehensive': 'bg-red-500/20 text-red-300 border-red-500/30'
    }
    return colors[category] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  }

  const getCategoryName = (category: string) => {
    const names = {
      'simple': 'Simple',
      'timeline': 'Timeline',
      'decision': 'Decision',
      'relationship': 'Relationship',
      'wellness': 'Wellness',
      'comprehensive': 'Comprehensive'
    }
    return names[category] || category
  }

  const getEnhancedCardInterpretation = (card: CardInfo) => {
    if (!enhancedCards) return undefined

    // Convert card name to the key format used in enhanced cards (e.g., "The Fool" -> "the_fool")
    const cardKey = card.name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '').replace(/&/g, 'and')
    const cardData = enhancedCards[cardKey]

    if (cardData && cardData.core_meanings) {
      const upright = cardData.core_meanings.upright
      const reversed = cardData.core_meanings.reversed
      
      return {
        general: upright.essence || `${card.name} represents a powerful energy in your reading.`,
        upright: {
          essence: upright.essence,
          keywords: upright.keywords,
          psychological: upright.psychological,
          spiritual: upright.spiritual,
          practical: upright.practical,
          shadow: upright.shadow
        },
        reversed: {
          essence: reversed.essence,
          keywords: reversed.keywords,
          psychological: reversed.psychological,
          spiritual: reversed.spiritual,
          practical: reversed.practical,
          shadow: reversed.shadow
        },
        archetype: cardData.archetype,
        suit: cardData.suit
      }
    }
    return undefined
  }

  const getCardInterpretation = (card: CardInfo) => {
    // Try enhanced cards first, fallback to legacy interpretations
    const enhanced = getEnhancedCardInterpretation(card)
    if (enhanced) return enhanced

    if (!interpretations) return undefined
    
    const cardData = interpretations.cards[card.name]
    
    if (cardData) {
      return {
        general: cardData.general,
        upright: cardData.upright,
        reversed: cardData.reversed
      }
    } else {
      // Provide fallback interpretation if card not found in data
      return {
        general: `${card.name} represents a powerful energy in your reading that invites reflection and growth.`,
        upright: 'This card in its upright position brings positive energy and clear guidance to your situation.',
        reversed: 'When reversed, this card suggests the need for patience, reflection, or a different approach.'
      }
    }
  }

  const getPositionMeaning = (card: CardInfo, selectedSpread: {id: string, name: string} | null) => {
    if (!spreadsConfig || !selectedSpread) {
      return "This position represents a specific aspect of your reading."
    }
    
    // Find the spread configuration
    const spread = spreadsConfig.spreads.find(s => s.id === selectedSpread.id)
    if (!spread) {
      return "This position represents a specific aspect of your reading."
    }
    
    // Find the position by name
    const position = spread.positions.find(p => p.name === card.position)
    if (position) {
      // Use detailed_description if available, fallback to short_description or description
      return position.detailed_description || position.short_description || position.description || "This position represents a specific aspect of your reading."
    } else {
      return `The ${card.position} position represents a specific aspect of your reading that provides insight into your situation.`
    }
  }

  // Load interpretations and spreads config on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load interpretations (legacy)
        const interpretationsResponse = await axios.get('http://127.0.0.1:8000/api/interpretations')
        setInterpretations(interpretationsResponse.data)

        // Load enhanced cards data
        const enhancedCardsResponse = await axios.get('http://127.0.0.1:8000/api/enhanced-cards')
        setEnhancedCards(enhancedCardsResponse.data)

        // Load spreads configuration
        const spreadsResponse = await axios.get('http://127.0.0.1:8000/api/spreads')
        const config: SpreadsConfig = spreadsResponse.data
        setSpreadsConfig(config)

        // Extract available spreads for dropdown with categories
        const spreads = config.spreads.map(spread => ({
          id: spread.id,
          name: spread.name,
          category: spread.category
        }))
        setAvailableSpreads(spreads)
      } catch (error) {
        console.error('Failed to load data:', error)
      }
    }
    loadData()
  }, [])

  return {
    interpretations,
    enhancedCards,
    spreadsConfig,
    availableSpreads,
    getCategoryColor,
    getCategoryName,
    getCardInterpretation,
    getPositionMeaning
  }
}