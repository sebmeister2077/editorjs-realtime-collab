import { TEMP_ENVIRONMENT_URL } from "../support/constants";
import fixture from '../fixtures/example.json'

describe("Test", () => {

    before(() => {
        cy.interceptConsoleErrors()
        cy.prepareFixture(fixture);
        cy.visit(TEMP_ENVIRONMENT_URL)
    })

    it("It works without errors", () => {
        cy.waitForEditorsToLoad();
        cy.wait(200)
        cy.assertNoConsoleErrors()
    })
})