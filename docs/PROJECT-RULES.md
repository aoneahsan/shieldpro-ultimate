# Project Rules and Guidelines

## URL State Persistence

### Rule: All UI navigation and state changes must be persisted in the URL

**Why**: This ensures good UX where users can:
- Refresh the page and stay on the same tab/view
- Share specific views with others
- Use browser back/forward navigation naturally
- Bookmark specific states

**Implementation**:
- Use pathname for major sections (e.g., `/options/filters`, `/options/settings`)
- Use query params for sub-states (e.g., `?filter=active&sort=date`)
- Update URL immediately when user navigates
- Read URL on component mount to restore state
- Handle invalid URLs gracefully with fallback to default view

**Example**:
```typescript
// When user clicks on Filters tab
navigate('/options/filters');

// When user applies a filter
navigate('/options/filters?category=ads&status=active');
```

## Marketing Strategy - Early Adopter Program 🎉

### First 100,000 Users Get Everything FREE! 🚀

**Core Principle**: The first 100,000 users who install our extension get **lifetime access to ALL features** across ALL tiers, completely FREE!

**Implementation**:
1. **No Feature Blocking**: All features from Tier 1-5 are available immediately
2. **Clear Attribution**: Each feature shows which tier it belongs to (for educational purposes)
3. **Friendly Messaging**: Use emojis and friendly language to celebrate early adopters
4. **Transparency**: Clearly explain the program on a dedicated page

**Messaging Examples**:
- "🎉 As an early adopter, you have lifetime access to ALL features!"
- "⭐ This is a Tier 3 feature - FREE for you as an early supporter!"
- "🚀 Tier 5 AI Features - Exclusively yours, no restrictions!"

**User Education Page Content**:
- Congratulate them on being an early adopter
- Explain they have lifetime access to everything
- Show what each tier normally includes
- Encourage them to share with friends
- Display their early adopter number (e.g., "#42,337 of 100,000")

## Feature Display Rules

### For Early Adopters (First 100k Users)

1. **Show All Features**: Everything is visible and accessible
2. **Add Tier Badges**: Small, non-intrusive badges showing tier level
3. **Celebration Mode**: Use colors and emojis to make it feel special
4. **No Upgrade Prompts**: Never ask early adopters to upgrade

### For Regular Users (After 100k)

1. **Progressive Unlock**: Features unlock based on tier requirements
2. **Clear Requirements**: Show what's needed to unlock each tier
3. **Gentle Encouragement**: Friendly prompts to progress to next tier
4. **Value Communication**: Explain benefits of each tier clearly

## UI/UX Principles

1. **State Persistence**: Always persist UI state in URL
2. **Responsive Design**: Works perfectly on all screen sizes
3. **Accessibility**: Follow WCAG guidelines
4. **Performance**: Lazy load heavy components
5. **Error Handling**: Graceful degradation with helpful messages

## Component Guidelines

1. **Single Responsibility**: Each component does one thing well
2. **Props Validation**: Use TypeScript for type safety
3. **Error Boundaries**: Wrap features in error boundaries
4. **Loading States**: Always show loading indicators
5. **Empty States**: Design meaningful empty states

## Communication Tone

- **Friendly & Approachable**: Use conversational language
- **Celebratory**: Make users feel special about being early adopters
- **Informative**: Clearly explain features and benefits
- **Non-pushy**: Never pressure users, especially early adopters
- **Emoji Usage**: Use emojis to add personality (🎉 🚀 ⭐ 💪 🛡️ ✨)

## Development Practices

1. **Document Decisions**: Record all important decisions in `/docs`
2. **Test Coverage**: Maintain 80%+ test coverage
3. **Code Reviews**: All PRs require review
4. **Performance Monitoring**: Track key metrics
5. **User Feedback**: Implement feedback mechanisms

## Update Log

- **2024-01-27**: Initial documentation created
- **2024-01-27**: Added URL state persistence rules
- **2024-01-27**: Added early adopter marketing strategy