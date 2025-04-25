/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
import EditorJS from '@editorjs/editorjs'
import { EDITOR_CLASSES } from './constants';


Cypress.Commands.add("interceptConsoleErrors", () => {
    cy.window().then((win) => {
        cy.spy(win.console, 'error').as('consoleError');
    });
})
Cypress.Commands.add("assertNoConsoleErrors", () => {
    cy.get('@consoleError').should('not.have.been.called');
})
Cypress.Commands.add("waitForEditorsToLoad", () => {
    cy.window().then(win => {
        return new Cypress.Promise((resolve, rej) => {

            console.dir(win.editors)
            const editors = win.Object.values(win.editors);
            Promise.allSettled(editors.map(e => e.isReady))
                .then(responses => {
                    if (responses.some(r => r.status === 'rejected'))
                        rej();
                    resolve()
                })
        })
    })
})
Cypress.Commands.add("prepareFixture", (fixture: Object) => {
    cy.intercept('/get-data', fixture);
})


Cypress.Commands.add("getBlockByIndex", function (holder: string, index: number) {
    return cy.document().then(function (doc) {
        return doc.querySelector(`#${holder} .${EDITOR_CLASSES.BaseBlock}:nth-child(${index + 1})`) as HTMLElement;
    })
})


Cypress.Commands.add("openToolbarForBlockIndex", function (holder: string, index: number) {
    cy.get(`#${holder} .${EDITOR_CLASSES.BaseBlock}:nth-child(${index + 1})`).click();
    cy.get(`#${holder} .${EDITOR_CLASSES.ToolbarSettings}`).should("be.visible").click()
})

declare global {
    namespace Cypress {
        interface Chainable {
            interceptConsoleErrors(): Chainable<void>;
            assertNoConsoleErrors(): Chainable<void>;
            waitForEditorsToLoad(): Chainable<void>;
            getBlockByIndex(holder: string, index: number): Cypress.Chainable<JQuery<HTMLElement>>;
            openToolbarForBlockIndex(holder: string, index: number): Cypress.Chainable<void>;
            prepareFixture(fixture: object): Chainable<void>
        }
    }
    interface Window {
        editors: Record<"holder1" | "holder2", EditorJS>
    }
}

export { }