// Imports
const defaultLog  = require('winston').loggers.get('default');
const Actions     = require('../helpers/actions');
const projectDAO  = require('../dao/projectDAO');
const documentDAO = require('../dao/documentDAO');
const constants   = require('../helpers/constants');

async function getProjectHandler(roles, params)
{
    let data = {};

    // fetch a project, or a list of projects
    if (params.hasOwnProperty('projId'))
    {
        let projectId = params.projId.value;
        
        defaultLog.debug(' Fetching project ' + projectId);
        data = await projectDAO.getProject(roles, projectId);
        data = projectDAO.projectHateoas(data, roles);
    }
    else
    {
        let pageNumber = params.hasOwnProperty('pageNumber') && params.pageNumber.value ? params.pageNumber.value : 1;
        let pageSize   = params.hasOwnProperty('pageSize')   && params.pageSize.value   ? params.pageSize.value   : 10;
        let sortBy     = params.hasOwnProperty('sortBy')     && params.sortBy.value     ? params.sortBy.value     : '';
        let query      = params.hasOwnProperty('query')      && params.query.value      ? params.query.value      : '';
        let keywords   = params.hasOwnProperty('keywords')   && params.keywords.value   ? params.keywords.value   : '';

        data = await projectDAO.getProjects(roles, pageNumber, pageSize, sortBy, keywords, query);

        for(let projectIndex in data[0].searchResults)
        {
            let project = data[0].searchResults[projectIndex];
            project = projectDAO.projectHateoas(project, roles);
        }
    }

    return data;
} 

// Exports

// OPTIONS
exports.projectOptions = function (args, res, next)
{
  res.status(200).send();
};

exports.projectOptionsProtected = function (args, res, next)
{
  res.status(200).send();
};

// HEAD
exports.projectHead = async function (args, res, next) 
{
    defaultLog.debug('>>> {HEAD}/Public/Projects');

    try
    {
        let data = await getProjectHandler(constants.PUBLIC_ROLES, args.swagger.params);

        return data ? Actions.sendResponseV2(res, 200, data) 
                    : Actions.sendResponseV2(res, 404, { code: 404, message: 'Project information was not found'});
    }
    catch (e)
    {
        defaultLog.error('### Error in {HEAD}/Public/Projects/ :', e);
        return Actions.sendResponseV2(res, 500, { code: '500', message: 'Internal Server Error', self: 'Api/Public/Projects' });        
    }
    finally
    {
        defaultLog.debug('<<< {HEAD}/Public/Projects');
    }
};

exports.projectHeadProtected = async function (args, res, next) 
{
    defaultLog.debug('>>> {HEAD}/Projects');

    try
    {
        let data = await getProjectHandler(constants.SECURE_ROLES, args.swagger.params);

        return data ? Actions.sendResponseV2(res, 200, data) 
                    : Actions.sendResponseV2(res, 404, { code: 404, message: 'Project information was not found'});
    }
    catch (e)
    {
        defaultLog.error('### Error in {HEAD}/Projects/ :', e);
        return Actions.sendResponseV2(res, 500, { code: '500', message: 'Internal Server Error', self: 'Api/Projects' });        
    }
    finally
    {
        defaultLog.debug('<<< {HEAD}/Projects');
    }
};

// GET (Public/Protected)
exports.fetchProjects = async function (args, res, next) 
{
    defaultLog.debug('>>> {GET}/Public/Projects');

    try
    {
        let data = await getProjectHandler(constants.PUBLIC_ROLES, args.swagger.params);

        return data ? Actions.sendResponseV2(res, 200, data)
                    : Actions.sendResponseV2(res, 404, { code: 404, message: 'Project information was not found'});
    }
    catch (e)
    {
        defaultLog.error('### Error in {GET}/Public/Projects/ :', e);
        return res.json({ code: '500', message: 'Internal Server Error', self: 'Api/Public/Projects' });        
    }
    finally
    {
        defaultLog.debug('<<< {GET}/Public/Projects');
    }
};

exports.fetchProjectsProtected = async function (args, res, next) 
{
    defaultLog.debug('>>> {GET}/Projects');

    try
    {
        let data = await getProjectHandler(constants.SECURE_ROLES, args.swagger.params);

        return data ? Actions.sendResponseV2(res, 200, data) 
                    : Actions.sendResponseV2(res, 404, { code: 404, message: 'Project information was not found'});
    }
    catch (e)
    {
        defaultLog.error('### Error in {GET}/Projects/ :', e);
        return Actions.sendResponseV2(res, 500, { code: '500', message: 'Internal Server Error', self: 'Api/Public/Projects' });        
    }
    finally
    {
        defaultLog.debug('<<< {GET}/Projects');
    }
};

// POST (Protected Only, createProject)
exports.createProject = async function (args, res, next) 
{
    defaultLog.debug('>>> {POST}/Projects');

    try
    {
        if (args.swagger.params.hasOwnProperty('project'))
        {
            defaultLog.debug('Creating new project');
            
            let project = args.swagger.params.project.value;

            project = await projectDAO.createProject(args.swagger.params.auth_payload.preferred_username, project);
            
            if(project)
            {
                // If the resource was successfully created, fetch it and return it
                project = await projectDAO.getProject(constants.SECURE_ROLES, project._id);
                
                project = projectDAO.projectHateoas(project, constants.SECURE_ROLES);
                return Actions.sendResponseV2(res, 201, project);
            }
            else
            {
                throw Error('Project could not be created');
            }
        }
        else
        {
            throw Error('Invalid request');
        }
    }
    catch (e)
    {
        defaultLog.error('### Error in {POST}/Projects/ :', e);
        return Actions.sendResponseV2(res, 500, { code: '500', message: 'Internal Server Error', self: 'Api/Projects' });        
    }
    finally
    {
        defaultLog.debug('<<< {POST}/Projects');
    }
};

// PUT (Protected Only updateProject)
exports.updateProject = async function (args, res, next) 
{
    defaultLog.debug('>>> {PUT}/Projects');

    try
    {
        if (args.swagger.params.hasOwnProperty('projId') && args.swagger.params.hasOwnProperty('project'))
        {
            let projectId = args.swagger.params.projId.value;
            
            defaultLog.debug(' Updating project ' + projectId);
            
            let sourceProject = await projectDAO.getProject(constants.SECURE_ROLES, projectId);
            let updatedProject = args.swagger.params.project.value;

            if(sourceProject && updateProject)
            {
                updatedProject = await projectDAO.updateProject(args.swagger.params.auth_payload.preferred_username, sourceProject, updatedProject);

                updatedProject = projectDAO.projectHateoas(updatedProject, roles);
                return Actions.sendResponseV2(res, 200, updatedProject);
            }
            else
            {
                return Actions.sendResponseV2(res, 404, { status: 404, message: 'Project ' + projectId + ' not found.'});
            }
        }
        else
        {
            throw Error('Invalid request');
        }
    }
    catch (e)
    {
        defaultLog.error('### Error in {PUT}/Projects/ :', e);
        return Actions.sendResponseV2(res, 500, { code: '500', message: 'Internal Server Error', self: 'Api/Projects' });        
    }
    finally
    {
        defaultLog.debug('<<< {PUT}/Projects');
    }
};

// DELETE (Protected Only, deleteProject)
exports.deleteProject = async function (args, res, next) 
{
    defaultLog.debug('>>> {DELETE}/Projects');

    try
    {
        if (args.swagger.params.hasOwnProperty('projId'))
        {
            let projectId = args.swagger.params.projId.value;
            
            defaultLog.debug(' Deleting project ' + projectId);
            
            let project = await projectDAO.getProject(constants.SECURE_ROLES, projectId);

            if(project)
            {
                project = await projectDAO.deleteProject(args.swagger.params.auth_payload.preferred_username, project);

                // delete endpoints return the original resource so
                // 1.) we honour the principle of idempotency and safety
                // 2.) we can recreate the resource in the event this was done in error
                project = projectDAO.projectHateoas(project, roles);
                return Actions.sendResponseV2(res, 200, project);
            }
            else
            {
                return Actions.sendResponseV2(res, 404, { status: 404, message: 'Project ' + projectId + ' not found.'});
            }
        }
        else
        {
            throw Error('Invalid request');
        }
    }
    catch (e)
    {
        defaultLog.error('### Error in {DELETE}/Projects/ :', e);
        return Actions.sendResponseV2(res, 500, { code: '500', message: 'Internal Server Error', self: 'Api/Projects' });        
    }
    finally
    {
        defaultLog.debug('<<< {DELETE}/Projects');
    }
};

// PUT (Protected Only, publishProject)
exports.publishProject = async function (args, res, next) 
{
    defaultLog.debug('>>> {PUT}/Projects{id}/Publish');

    try
    {
        if (args.swagger.params.hasOwnProperty('projId'))
        {
            let projectId = args.swagger.params.projId.value;
            
            defaultLog.debug(' Publishing project ' + projectId);
            
            let project = await projectDAO.getProject(constants.SECURE_ROLES, projectId);

            if(project)
            {
                project = await projectDAO.publishProject(args.swagger.params.auth_payload.preferred_username, project);
                project = projectDAO.projectHateoas(project, roles);
                return Actions.sendResponseV2(res, 200, project);
            }
            else
            {
                return Actions.sendResponseV2(res, 404, { status: 404, message: 'Project ' + projectId + ' not found.'});
            }
        }
        else
        {
            throw Error('Invalid request');
        }
    }
    catch (e)
    {
        defaultLog.error('### Error in {PUT}/Projects{id}/Publish :', e);
        return Actions.sendResponseV2(res, 500, { code: '500', message: 'Internal Server Error', self: 'Api/Projects{id}/Publish' });        
    }
    finally
    {
        defaultLog.debug('<<< {PUT}/Projects{id}/Publish');
    }
};

// PUT (Protected Only, unPublishProject)
exports.unPublishProject = async function (args, res, next) 
{
    defaultLog.debug('>>> {PUT}/Projects{id}/Unpublish');

    try
    {
        if (args.swagger.params.hasOwnProperty('projId'))
        {
            let projectId = args.swagger.params.projId.value;
            
            defaultLog.debug(' Un-Publishing project ' + projectId);
            
            let project = await projectDAO.getProject(constants.SECURE_ROLES, projectId);

            if(project)
            {
                project = await projectDAO.unPublishProject(args.swagger.params.auth_payload.preferred_username, project);
                project = projectDAO.projectHateoas(project, roles);
                return Actions.sendResponseV2(res, 200, project);
            }
            else
            {
                return Actions.sendResponseV2(res, 404, { status: 404, message: 'Project ' + projectId + ' not found.'});
            }
        }
        else
        {
            throw Error('Invalid request');
        }
    }
    catch (e)
    {
        defaultLog.error('### Error in {PUT}/Projects{id}/Unpublish :', e);
        return Actions.sendResponseV2(res, 500, { code: '500', message: 'Internal Server Error', self: 'Api/Projects{id}/Unpublish' });        
    }
    finally
    {
        defaultLog.debug('<<< {PUT}/Projects{id}/Unpublish');
    }
};

// Extensions should be a model, and include endpoints for fetching
// these could also be broken out of project controller and put into an extension controller

// POST (Protected Only, createExtension)
exports.createProjectExtension = async function (args, res, next)
{
    defaultLog.debug('>>> {POST}/Projects/{id}/Extensions');

    try
    {
        if (args.swagger.params.hasOwnProperty('projId') && args.swagger.params.hasOwnProperty('extension'))
        {
            let projectId = args.swagger.params.projId.value;
            let extension = args.swagger.params.extension.value;

            defaultLog.debug(' Adding extension to project ' + projectId);
            defaultLog.debug(' Extension: ' + JSON.stringify(extension));

            let project = await projectDAO.getProject(constants.SECURE_ROLES, projectId);

            if(project)
            {
                project = await projectDAO.addExtension(args.swagger.params.auth_payload.preferred_username, extension, project);
                project = projectDAO.projectHateoas(project, roles);
                return Actions.sendResponseV2(res, 201, project);
            }
            else
            {
                return Actions.sendResponseV2(res, 404, { status: 404, message: 'Project ' + projectId + ' not found.'});
            }
        }
        else
        {
            throw Error('Invalid request');
        }
    }
    catch (e)
    {
        defaultLog.error('### Error in {POST}/Projects/{id}/Extensions :', e);
        return Actions.sendResponseV2(res, 500, { code: '500', message: 'Internal Server Error', self: 'Api/Projects{id}/Extensions' });        
    }
    finally
    {
        defaultLog.debug('<<< {POST}/Projects/{id}/Extensions');
    }
};

// PUT (Protected Only, updateExtension)
exports.updateProjectExtension = async function (args, res, next)
{
    defaultLog.debug('>>> {PUT}/Projects/{id}/Extensions');

    try
    {
        if (args.swagger.params.hasOwnProperty('projId') && args.swagger.params.hasOwnProperty('extension'))
        {
            let projectId = args.swagger.params.projId.value;
            let extension = args.swagger.params.extension.value;

            defaultLog.debug(' Updating extension on project ' + projectId);
            defaultLog.debug(' Extension: ' + JSON.stringify(extension));

            let project = await projectDAO.getProject(constants.SECURE_ROLES, projectId);

            if(project)
            {
                project = await projectDAO.updateExtension(args.swagger.params.auth_payload.preferred_username, extension, project);
                project = projectDAO.projectHateoas(project, roles);
                return Actions.sendResponseV2(res, 200, project);
            }
            else
            {
                return Actions.sendResponseV2(res, 404, { status: 404, message: 'Project ' + projectId + ' not found.'});
            }
        }
        else
        {
            throw Error('Invalid request');
        }
    }
    catch (e)
    {
        defaultLog.error('### Error in {PUT}/Projects/{id}/Extensions :', e);
        return Actions.sendResponseV2(res, 500, { code: '500', message: 'Internal Server Error', self: 'Api/Projects{id}/Extensions' });        
    }
    finally
    {
        defaultLog.debug('<<< {PUT}/Projects/{id}/Extensions');
    }
};

// DELETE (Protected Only, deleteExtension)
exports.deleteProjectExtension = async function (args, res, next)
{
    defaultLog.debug('>>> {DELETE}/Projects/{id}/Extensions');

    try
    {
        if (args.swagger.params.hasOwnProperty('projId') && args.swagger.params.hasOwnProperty('extension'))
        {
            let projectId = args.swagger.params.projId.value;
            let extension = JSON.parse(args.swagger.params.item.value);

            defaultLog.debug(' Updating extension on project ' + projectId);
            defaultLog.debug(' Extension: ' + JSON.stringify(extension));

            let project = await projectDAO.getProject(constants.SECURE_ROLES, projectId);

            if(project)
            {
                project = await projectDAO.updateExtension(args.swagger.params.auth_payload.preferred_username, extension, project);
                project = projectDAO.projectHateoas(project, roles);
                return Actions.sendResponseV2(res, 200, project);
            }
            else
            {
                return Actions.sendResponseV2(res, 404, { status: 404, message: 'Project ' + projectId + ' not found.'});
            }
        }
        else
        {
            throw Error('Invalid request');
        }
    }
    catch (e)
    {
        defaultLog.error('### Error in {DELETE}/Projects/{id}/Extensions :', e);
        return Actions.sendResponseV2(res, 500, { code: '500', message: 'Internal Server Error', self: 'Api/Projects{id}/Extensions' });
    }
    finally
    {
        defaultLog.debug('<<< {DELETE}/Projects/{id}/Extensions');
    }
};

exports.fetchFeaturedDocuments = async function (args, res, next) 
{
    defaultLog.debug('>>> {GET}/Public/Projects/{id}/FeaturedDocuments');

    try
    {
        if (args.swagger.params.projId && args.swagger.params.projId.value) 
        {
            let project = await projectDAO.getProject(constants.PUBLIC_ROLES, args.swagger.params.projId.value);
            let featuredDocs = await getFeaturedDocuments(project, true);

            return Actions.sendResponseV2(res, 200, featuredDocs);
        } 
        else 
        {
            return Actions.sendResponseV2(res, 404, { status: 404, message: 'Project not found'});
        }
    }
    catch(e)
    {
        defaultLog.error('### Error in {GET}/Public/Projects/{id}/FeaturedDocuments :', e);
        return Actions.sendResponseV2(res, 500, { code: '500', message: 'Internal Server Error', self: 'Api/Public/Projects{id}/FeaturedDocuments' });
    }
    finally
    {
        defaultLog.debug('<<< {GET}/Public/Projects/{id}/FeaturedDocuments');
    }
};
  
exports.fetchFeaturedDocumentsSecure = async function (args, res, next) 
{
    defaultLog.debug('>>> {GET}/Projects/{id}/FeaturedDocuments');

    try
    {
        if (args.swagger.params.projId && args.swagger.params.projId.value) 
        {
            let project = await projectDAO.getProject(args.swagger.params.projId.value);
            
            let featuredDocs = await getFeaturedDocuments(project, false);
        
            return Actions.sendResponseV2(res, 200, featuredDocs);
        } 
    
        return Actions.sendResponseV2(res, 404, { status: 404, message: 'Project not found'});
    }
    catch(e)
    {
        defaultLog.error('### Error in {GET}/Projects/{id}/FeaturedDocuments :', e);
        return Actions.sendResponseV2(res, 500, { code: '500', message: 'Internal Server Error', self: 'Api/Projects{id}/FeaturedDocuments' });
    }
    finally
    {
        defaultLog.debug('<<< {GET}/Projects/{id}/FeaturedDocuments');
    }
};
  
var getFeaturedDocuments = async function(project, sanitizeForPublic) 
{
    try 
    {
        let documents = await mongoose.model('Document').find({ project: project._id, isFeatured: true });
        
        if(documents)
        {
            return documents;
        }
        else
        {
            throw Error('Featured documents could not be loaded.');
        }
    } 
    catch(e) 
    {
        throw Error(e);
    }
}

exports.fetchDocuments = async function (args, res, next) 
{
    defaultLog.debug('>>> {GET}/Public/Projects/{id}/Documents');

    try
    {
        if (args.swagger.params.projId && args.swagger.params.projId.value) 
        {
            let pageNumber = args.swagger.params.hasOwnProperty('pageNumber') && args.swagger.params.pageNumber.value ? args.swagger.params.pageNumber.value : 1;
            let pageSize   = args.swagger.params.hasOwnProperty('pageSize')   && args.swagger.params.pageSize.value   ? args.swagger.params.pageSize.value   : 10;
            let sortBy     = args.swagger.params.hasOwnProperty('sortBy')     && args.swagger.params.sortBy.value     ? args.swagger.params.sortBy.value     : '';
            let query      = args.swagger.params.hasOwnProperty('query')      && args.swagger.params.query.value      ? args.swagger.params.query.value      : '';
            let keywords   = args.swagger.params.hasOwnProperty('keywords')   && args.swagger.params.keywords.value   ? args.swagger.params.keywords.value   : '';

            let documents = await documentDAO.fetchDocuments(pageNumber, pageSize, sortBy, query, keywords, [args.swagger.params.projId.value], [], constants.PUBLIC_ROLES);

            return Actions.sendResponseV2(res, 200, documents);
        } 
        else 
        {
            return Actions.sendResponseV2(res, 404, { status: 404, message: 'Project not found'});
        }
    }
    catch(e)
    {
        defaultLog.error('### Error in {GET}/Public/Projects/{id}/Documents :', e);
        return Actions.sendResponseV2(res, 500, { code: '500', message: 'Internal Server Error', self: 'Api/Public/Projects{id}/Documents' });
    }
    finally
    {
        defaultLog.debug('<<< {GET}/Public/Projects/{id}/Documents');
    }
};

exports.fetchDocumentsSecure = async function (args, res, next) 
{
    defaultLog.debug('>>> {GET}/Projects/{id}/Documents');

    try
    {
        if (args.swagger.params.projId && args.swagger.params.projId.value) 
        {
            let pageNumber = args.swagger.params.hasOwnProperty('pageNumber') && args.swagger.params.pageNumber.value ? args.swagger.params.pageNumber.value : 1;
            let pageSize   = args.swagger.params.hasOwnProperty('pageSize')   && args.swagger.params.pageSize.value   ? args.swagger.params.pageSize.value   : 10;
            let sortBy     = args.swagger.params.hasOwnProperty('sortBy')     && args.swagger.params.sortBy.value     ? args.swagger.params.sortBy.value     : '';
            let query      = args.swagger.params.hasOwnProperty('query')      && args.swagger.params.query.value      ? args.swagger.params.query.value      : '';
            let keywords   = args.swagger.params.hasOwnProperty('keywords')   && args.swagger.params.keywords.value   ? args.swagger.params.keywords.value   : '';

            let documents = await documentDAO.fetchDocuments(pageNumber, pageSize, sortBy, query, keywords, [args.swagger.params.projId.value], [], constants.SECURE_ROLES);

            return Actions.sendResponseV2(res, 200, documents);
        } 
        else 
        {
            return Actions.sendResponseV2(res, 404, { status: 404, message: 'Project not found'});
        }
    }
    catch(e)
    {
        defaultLog.error('### Error in {GET}/Projects/{id}/Documents :', e);
        return Actions.sendResponseV2(res, 500, { code: '500', message: 'Internal Server Error', self: 'Api/Projects/{id}/Documents' });
    }
    finally
    {
        defaultLog.debug('<<< {GET}/Projects/{id}/Documents');
    }
};