const urlPrefix = 'build/dist/';
const url = urlPrefix + 'resources/index.html';
const defaultFilters = '&f=state=failed&d=rootContainerId&d=assigned_id';
const failedFlowNodesUrl = 'API/bpm/flowNode?';
const defaultRequestUrl = urlPrefix + failedFlowNodesUrl + 'c=20&p=0' + defaultFilters;
const processUrl = urlPrefix + 'API/bpm/process?';
const processFilters = 'c=999&p=0&o=displayName ASC';
const defaultSortOrder = '&o=lastUpdateDate+DESC';
const failedFlowNodeDetailsUrl = '/bonita/apps/APP_TOKEN_PLACEHOLDER/admin-task-details?id=';

given("The filter response {string} is defined", (filterType) => {
    cy.server();
    switch (filterType) {
        case 'default filter':
            createRouteWithResponse(defaultRequestUrl, '', 'failedFlowNodes5Route', 'failedFlowNodes5');
            break;
        case 'process name':
            createRouteWithResponse(processUrl, processFilters, 'processesRoute', 'processes');
            createRouteWithResponse(defaultRequestUrl, '&f=processId=7623202965572839246', 'newVacationRequestRoute', 'emptyResult');
            createRouteWithResponse(defaultRequestUrl, '&f=processId=8617198282405797017', 'generateRandomCasesRoute', 'generateRandomCases');
            break;
        case 'sort by':
            createRoute('&o=name+ASC', 'sortByNameAscRoute');
            createRoute('&o=name+DESC', 'sortByNameDescRoute');
            createRoute('&o=lastUpdateDate+ASC', 'sortByUpdateDateAscRoute');
            createRoute(defaultSortOrder, 'sortByUpdateDateDescRoute');
            break;
        case 'sort during limitation':
            createRouteWithResponse(urlPrefix + failedFlowNodesUrl + 'c=20&p=0', defaultFilters + '&o=name+DESC', 'sortDisplayNameDescRoute', 'failedFlowNodes20');
            createRouteWithResponse(urlPrefix + failedFlowNodesUrl + 'c=10&p=2', defaultFilters + '&o=name+DESC', 'sortDisplayNameDescRoute2', 'failedFlowNodes10');
            break;
        case 'search by name':
            createRoute('&s=Alowscenario', 'searchRoute');
            createRouteWithResponse(defaultRequestUrl, '&s=Search term with no match', 'emptyResultRoute', 'emptyResult');
            break;
        case 'filter by caseId':
            createRoute('&f=caseId=2001', 'filterByCaseId2001Route');
            createRoute('&f=caseId=3001', 'filterByCaseId3001Route');
            break;
        case 'enable load more':
            createRouteWithResponse(defaultRequestUrl, '', 'failedFlowNodes20Route', 'failedFlowNodes20');
            createRouteWithResponseAndPagination('', 'failedFlowNodes10Route', 'failedFlowNodes10', 2, 10);
            createRouteWithResponseAndPagination('', 'failedFlowNodes5Route', 'failedFlowNodes5', 3, 10);
            createRouteWithResponseAndPagination('', 'emptyResultRoute', 'emptyResult', 4, 10);
            break;
        case 'enable 20 load more':
            createRouteWithResponse(defaultRequestUrl, '', 'failedFlowNodes20Route', 'failedFlowNodes20');
            createRouteWithResponseAndPagination('', 'emptyResultRoute', 'emptyResult', 2, 10);
            break;
        case 'enable 30 load more':
            createRouteWithResponse(defaultRequestUrl, '', 'failedFlowNodes20Route', 'failedFlowNodes20');
            createRouteWithResponseAndPagination('', 'failedFlowNodes10Route', 'failedFlowNodes10', 2, 10);
            createRouteWithResponseAndPagination('', 'emptyResultRoute', 'emptyResult', 3, 10);
            break;
        case 'empty default filter':
            createRouteWithResponse(defaultRequestUrl, '', 'emptyResultRoute', 'emptyResult');
            break;
        case 'empty process list':
            createRouteWithResponse(processUrl, processFilters, 'emptyResultRoute', 'emptyResult');
            break;
        default:
            throw new Error("Unsupported case");
    }

    function createRoute(queryParameter, routeName) {
        cy.route({
            method: 'GET',
            url: defaultRequestUrl + queryParameter,
        }).as(routeName);
    }

    function createRouteWithResponse(url, queryParameter, routeName, response) {
        let responseValue = undefined;
        if (response) {
            cy.fixture('json/' + response + '.json').as(response);
            responseValue = '@' + response;
        }

        cy.route({
            method: 'GET',
            url: url + queryParameter,
            response: responseValue
        }).as(routeName);
    }

    function createRouteWithResponseAndPagination(queryParameter, routeName, response, page, count) {
        const loadMoreUrl = urlPrefix + failedFlowNodesUrl + 'c=' + count + '&p=' + page + defaultFilters;
        let responseValue = undefined;
        if (response) {
            cy.fixture('json/' + response + '.json').as(response);
            responseValue = '@' + response;
        }

        cy.route({
            method: 'GET',
            url: loadMoreUrl + queryParameter,
            response: responseValue
        }).as(routeName);
    }
});

when("I visit admin task list page", () => {
    cy.visit(url);
    cy.wait(1000);
});

when("I visit admin task list page with caseId {string} in URL parameter", (caseId) => {
    cy.visit(url + "?caseId=" + caseId);
    cy.wait(1000);
});

when("I put {string} in {string} filter field", (filterValue, filterType) => {
    switch (filterType) {
        case 'process name':
            selectFilterProcessNameOption(filterValue);
            break;
        case 'sort by':
            selectSortByOption(filterValue);
            break;
        case 'search':
            searchForValue(filterValue);
            break;
        case 'caseId':
            filterCaseIdForValue(filterValue);
            break;
        default:
            throw new Error("Unsupported case");
    }

    function selectFilterProcessNameOption(filterValue) {
        switch (filterValue) {
            case 'All processes (all versions)':
                cy.get('select').eq(0).select('0');
                cy.wait('@generateRandomCasesRoute');
                break;
            case 'generateRandomCases (1.0)':
                cy.get('select').eq(0).select('1');
                break;
            case 'New vacation request with means of transportation (2.0)':
                cy.get('select').eq(0).select('2');
                break;
            default:
                throw new Error("Unsupported case");
        }
    }

    function selectSortByOption(filterValue) {
        switch (filterValue) {
            case 'Flow node name (Asc)':
                cy.get('select').eq(1).select('0');
                break;
            case 'Flow node name (Desc)':
                cy.get('select').eq(1).select('1');
                break;
            case 'Failed on (Newest first)':
                cy.get('select').eq(1).select('2');
                break;
            case 'Failed on (Oldest first)':
                cy.get('select').eq(1).select('3');
                break;
            default:
                throw new Error("Unsupported case");
        }
    }

    function searchForValue(filterValue) {
        cy.get('pb-input input:visible').eq(1).type(filterValue);
    }

    function filterCaseIdForValue(filterValue) {
        cy.get('pb-input input:visible').eq(0).type(filterValue);
    }
});

when("I erase the search filter", () => {
    cy.get('pb-input input:visible').eq(1).clear();
});

when("I erase the caseId filter", () => {
    cy.get('pb-input input:visible').eq(0).clear();
});

when("I click on Load more flow nodes button", () => {
    cy.get('button').contains('Load more flow nodes').click();
});

when("I click on refresh", ()=>{
    cy.get('button i.glyphicon-repeat:visible').click();
});

then("The failed flow nodes list have the correct information", () => {
    cy.get('.task-item').eq(0).within(() => {
        // Check that the element exist.
        cy.get('.item-label').contains('Priority');
        cy.get('.item-value').contains('--');
        cy.get('.item-label').contains('ID');
        cy.get('.item-value').contains('60002');
        cy.get('.item-label').contains('Name');
        cy.get('.item-value').contains('ALowScenario');
        cy.get('.item-label').contains('Display name');
        cy.get('.item-value').contains('ALowScenario display name');
        cy.get('.item-label').contains('Type');
        cy.get('.item-value').contains('User task');
        cy.get('.item-label').contains('Failed on');
        cy.get('.item-value').contains('1/16/20 10:13 AM');
        cy.get('.item-label').contains('Case ID');
        cy.get('.item-value').contains('3001');
        cy.get('.item-label').contains('Process name (version)');
        cy.get('.item-value').contains('generateRandomCases (1.0)');
        cy.get('.item-label').contains('Process display name');
        cy.get('.item-value').contains('generateRandomCases display name');
        cy.get('.glyphicon-option-horizontal').should('have.attr', 'title', 'View task details')
    });
    cy.get('.task-item').eq(1).within(() => {
        // Check that the element exist.
        cy.get('.item-label').contains('Priority');
        cy.get('.item-value').contains('Lowest');
        cy.get('.item-label').contains('ID');
        cy.get('.item-value').contains('60003');
        cy.get('.item-label').contains('Name');
        cy.get('.item-value').contains('A Lowest Scenario');
        cy.get('.item-label').contains('Display name');
        cy.get('.item-value').contains('A Lowest Scenario display name');
        cy.get('.item-label').contains('Type');
        cy.get('.item-value').contains('User task');
        cy.get('.item-label').contains('Failed on');
        cy.get('.item-value').contains('1/16/20 10:13 AM');
        cy.get('.item-label').contains('Case ID');
        cy.get('.item-value').contains('4001');
        cy.get('.item-label').contains('Process name (version)');
        cy.get('.item-value').contains('generateCases (1.0)');
        cy.get('.item-label').contains('Process display name');
        cy.get('.item-value').contains('generateCases display name');
        cy.get('.glyphicon-option-horizontal').should('have.attr', 'title', 'View task details')
    });
    cy.get('.task-item').eq(2).within(() => {
        // Check that the element exist.
        cy.get('.item-label').contains('Priority');
        cy.get('.item-value').contains('Highest');
        cy.get('.item-label').contains('ID');
        cy.get('.item-value').contains('60004');
        cy.get('.item-label').contains('Name');
        cy.get('.item-value').contains('A Highest Scenario');
        cy.get('.item-label').contains('Display name');
        cy.get('.item-value').contains('A Highest Scenario display name');
        cy.get('.item-label').contains('Type');
        cy.get('.item-value').contains('User task');
        cy.get('.item-label').contains('Failed on');
        cy.get('.item-value').contains('1/16/20 10:13 AM');
        cy.get('.item-label').contains('Case ID');
        cy.get('.item-value').contains('5001');
        cy.get('.item-label').contains('Process name (version)');
        cy.get('.item-value').contains('cases (1.0)');
        cy.get('.item-label').contains('Process display name');
        cy.get('.item-value').contains('Cases display name');
        cy.get('.glyphicon-option-horizontal').should('have.attr', 'title', 'View task details')
    });
    cy.get('.task-item').eq(3).within(() => {
        // Check that the element exist.
        cy.get('.item-label').contains('Priority');
        cy.get('.item-value').contains('High');
        cy.get('.item-label').contains('ID');
        cy.get('.item-value').contains('60005');
        cy.get('.item-label').contains('Name');
        cy.get('.item-value').contains('A High Scenario');
        cy.get('.item-label').contains('Display name');
        cy.get('.item-value').contains('A High Scenario display name');
        cy.get('.item-label').contains('Type');
        cy.get('.item-value').contains('User task');
        cy.get('.item-label').contains('Failed on');
        cy.get('.item-value').contains('1/16/20 10:13 AM');
        cy.get('.item-label').contains('Case ID');
        cy.get('.item-value').contains('6001');
        cy.get('.item-label').contains('Process name (version)');
        cy.get('.item-value').contains('donotgenerateRandomCases (1.0)');
        cy.get('.item-label').contains('Process display name');
        cy.get('.item-value').contains('Do not generateRandomCases display name');
        cy.get('.glyphicon-option-horizontal').should('have.attr', 'title', 'View task details')
    });
    cy.get('.task-item').eq(4).within(() => {
        // Check that the element exist.
        cy.get('.item-label').contains('Priority');
        cy.get('.item-value').contains('Normal');
        cy.get('.item-label').contains('ID');
        cy.get('.item-value').contains('60006');
        cy.get('.item-label').contains('Name');
        cy.get('.item-value').contains('A Normal Scenario');
        cy.get('.item-label').contains('Display name');
        cy.get('.item-value').contains('A Normal Scenario display name');
        cy.get('.item-label').contains('Type');
        cy.get('.item-value').contains('User task');
        cy.get('.item-label').contains('Failed on');
        cy.get('.item-value').contains('1/16/20 10:13 AM');
        cy.get('.item-label').contains('Case ID');
        cy.get('.item-value').contains('7001');
        cy.get('.item-label').contains('Process name (version)');
        cy.get('.item-value').contains('donotgenerateCases (1.0)');
        cy.get('.item-label').contains('Process display name');
        cy.get('.item-value').contains('Do not generateCases display name');
        cy.get('.glyphicon-option-horizontal').should('have.attr', 'title', 'View task details')
    });
});

then("The failed flow nodes list have the correct item shown number", () => {
    cy.get('.text-primary.item-label:visible').contains('Failed flow nodes shown: 5');
});

then("A list of {string} items is displayed", (nbrOfItems) => {
    cy.get('.task-item:visible').should('have.length', nbrOfItems);
});

then("The api call is made for {string}", (filterValue) => {
    switch (filterValue) {
        case 'generateRandomCases (1.0)':
            cy.wait('@processesRoute');
            break;
        case 'New vacation request with means of transportation (2.0)':
            cy.wait('@newVacationRequestRoute');
            break;
        case 'Flow node name (Asc)':
            cy.wait('@sortByNameAscRoute');
            break;
        case 'Flow node name (Desc)':
            cy.wait('@sortByNameDescRoute');
            break;
        case 'Failed on (Newest first)':
            cy.wait('@sortByUpdateDateDescRoute');
            break;
        case 'Failed on (Oldest first)':
            cy.wait('@sortByUpdateDateAscRoute');
            break;
        case 'Alowscenario':
            cy.wait('@searchRoute');
            break;
        case '2001':
            cy.wait('@filterByCaseId2001Route');
            break;
        case '3001':
            cy.wait('@filterByCaseId3001Route');
            break;
        default:
            throw new Error("Unsupported case");
    }
});

then("No failed flow nodes are available", () => {
    cy.get('.task-item:visible').should('have.length', 0);
    cy.contains('No failed flow nodes to display').should('be.visible');
});

then("The more button has correct href with {string}", (flowNodeId) => {
    cy.get('a .glyphicon-option-horizontal').parent().should('have.attr', 'href', failedFlowNodeDetailsUrl + flowNodeId);
});

then("The load more flow nodes button is disabled", () => {
    cy.get('button').contains('Load more flow nodes').should('be.disabled');
});

then("The load more flow nodes button has the correct text", () => {
    cy.contains("button", "Load more tasks").should("not.be.visible");
    cy.contains("button", "Load more flow nodes").should("be.visible");
});

then("Only the no failed flow node is displayed", () => {
    cy.contains('h4:visible', 'No failed flow nodes to display').should('be.visible');
    cy.contains('h4:visible', 'No done tasks to display').should('not.be.visible');
    cy.contains('h4:visible', 'No pending tasks to display').should('not.be.visible');
});

then("The filter by process is disabled", () => {
    cy.get('select:visible').eq(0).should('be.disabled');
});