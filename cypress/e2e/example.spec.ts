import { TEMP_ENVIRONMENT_URL } from "../support/constants";

describe("Test", () => {

    before(() => {
        cy.interceptConsoleErrors()
        cy.visit(TEMP_ENVIRONMENT_URL)
    })

    it("It works", () => {

    })

    it("Verify there are no console errors", () => {
        cy.assertNoConsoleErrors()
    })
})