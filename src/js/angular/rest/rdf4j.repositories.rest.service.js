angular
    .module('graphdb.framework.rest.rdf4j.repositories.service', [])
    .factory('RDF4JRepositoriesRestService', RDF4JRepositoriesRestService);

RDF4JRepositoriesRestService.$inject = ['$http', '$repositories'];

const ENABLE_SIMILARITY = 'INSERT DATA { <u:a> <http://www.ontotext.com/owlim/system#startplugin> \'similarity\' .}';
const SIMILARITY_ENABLED = 'select ?o where {\n' +
    '?s <http://www.ontotext.com/owlim/system#listplugins> ?o .\n' +
    'filter(str(?s) = \'similarity\')\n' +
    '} ';

const REPOSITORIES_ENDPOINT = 'repositories';

function RDF4JRepositoriesRestService($http, $repositories) {
    return {
        getNamespaces,
        getRepositoryNamespaces,
        updateNamespacePrefix,
        deleteNamespacePrefix,
        addStatements,
        enableSimilarityPlugin,
        checkSimilarityPluginEnabled,
        getRepositorySize,
        getGraphs,
        resolveGraphs
    };

    function getNamespaces(repositoryId) {
        return $http.get(`${REPOSITORIES_ENDPOINT}/${repositoryId}/namespaces`);
    }

    function getRepositoryNamespaces() {
        return $http.get(`${REPOSITORIES_ENDPOINT}/${$repositories.getActiveRepository()}/namespaces`);
    }

    function updateNamespacePrefix(repositoryId, namespace, prefix) {
        return $http({
            url: `${REPOSITORIES_ENDPOINT}/${repositoryId}/namespaces/${prefix}`,
            method: 'PUT',
            data: namespace
        });
    }

    function deleteNamespacePrefix(repositoryId, prefix) {
        return $http({
            url: `${REPOSITORIES_ENDPOINT}/${repositoryId}/namespaces/${prefix}`,
            method: 'DELETE'
        });
    }

    function addStatements(repositoryId, data) {
        return $http({
            url: `${REPOSITORIES_ENDPOINT}/${repositoryId}/statements`,
            method: 'POST',
            data,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        });
    }

    function enableSimilarityPlugin() {
        return $.ajax({
            method: 'POST',
            url: `${REPOSITORIES_ENDPOINT}/${$repositories.getActiveRepository()}/statements`,
            data: {
                update: ENABLE_SIMILARITY
            }
        });
    }

    function checkSimilarityPluginEnabled() {
        return $.ajax({
            method: 'GET',
            url: `${REPOSITORIES_ENDPOINT}/${$repositories.getActiveRepository()}`,
            data: {
                query: SIMILARITY_ENABLED
            }
        });
    }

    function getRepositorySize() {
        return $http.get(`${REPOSITORIES_ENDPOINT}/${$repositories.getActiveRepository()}/size`);
    }

    function getGraphs(repositoryId) {
        return $http.get(`${REPOSITORIES_ENDPOINT}/${repositoryId}/contexts`);
    }


    function resolveGraphs() {
        let activeRepository = $repositories.getActiveRepository();
        if (activeRepository !== "") {
            return getGraphs(activeRepository).success(function (graphs) {
                    graphs.results.bindings.unshift({
                        contextID: {
                            type: "default",
                            value: "The default graph"
                        }
                    });

                    Object.keys(graphs.results.bindings).forEach(function (key) {
                        const binding = graphs.results.bindings[key];
                        if (binding.contextID.type === "bnode") {
                            binding.contextID.value = '_:' + binding.contextID.value;
                        } else if (binding.contextID.type === "default") {
                            binding.contextID.uri = "http://www.openrdf.org/schema/sesame#nil";
                        } else {
                            binding.contextID.uri = binding.contextID.value;
                        }
                    });
                    graphs.results.bindings.unshift({
                        contextID: {
                            type: "all",
                            value: "All graphs",
                            uri: ""
                        }
                    });
                    return  graphs.results.bindings;
            });
        }
    }
}
