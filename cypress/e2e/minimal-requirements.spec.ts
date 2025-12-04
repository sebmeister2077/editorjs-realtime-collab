import { HOLDERS, TEMP_ENVIRONMENT_URL } from "../support/constants";
import fixture from '../fixtures/example.json'

describe("Verify minimal build requirement", () => {
    beforeEach(() => {
        cy.interceptConsoleErrors()
        cy.prepareFixture(fixture);
        cy.visit(TEMP_ENVIRONMENT_URL)
    })

    it("It works without errors", () => {
        cy.waitForEditorsToLoad();
        cy.assertNoConsoleErrors()
    })

    it("I can see the paragraphs", () => {
        cy.waitForEditorsToLoad();

        fixture.forEach((block, idx) => {

            HOLDERS.getAllHolders().forEach(holder => {
                cy.getBlockByIndex(holder, idx).then($el => {
                    console.log("🚀 ~ cy.getBlockByIndex ~ $el:", $el)
                    expect($el).to.not.eq(null)
                    expect($el.text()).to.eq(block.data.text)

                    expect($el.attr("data-id")).to.eq(block.id)
                })
            })


        })
    })
})