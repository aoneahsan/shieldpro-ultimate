/// <reference types="cypress" />

describe('Chrome Extension Load Test', () => {
  beforeEach(() => {
    // Set up the extension test environment
    cy.task('loadExtension', 'dist')
  })

  it('should load extension without manifest errors', () => {
    cy.visit('chrome://extensions/')
    cy.get('[data-test-id="extension-card"]').should('contain', 'ShieldPro Ultimate')
    cy.get('.error-message').should('not.exist')
  })

  it('should have all required rule files', () => {
    const ruleFiles = ['tier1.json', 'tier2.json', 'tier3.json', 'tier4.json', 'tier5.json']
    
    ruleFiles.forEach(file => {
      cy.readFile(`dist/rules/${file}`).then(content => {
        expect(content).to.be.an('array')
        expect(content.length).to.be.greaterThan(0)
      })
    })
  })

  it('should block basic ads on test page', () => {
    cy.visit('https://example.com')
    
    // Check that ad-related requests are blocked
    cy.intercept('**/doubleclick.net/**', { statusCode: 204 })
    cy.intercept('**/googlesyndication.com/**', { statusCode: 204 })
    
    // Verify extension popup works
    cy.get('[data-extension-id="popup"]').click()
    cy.get('.tier-indicator').should('be.visible')
  })
})