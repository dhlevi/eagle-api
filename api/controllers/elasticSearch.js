const mongoose     = require('mongoose');
const mongoosastic = require('mongoosastic');
const defaultLog   = require('winston').loggers.get('default');
const Actions      = require('../helpers/actions');
const constants    = require('../helpers/constants');
const projectDAO   = require('../dao/projectDAO');
const documentDAO = require('../dao/documentDAO');

exports.options = async function (args, res, next)
{
    res.status(200).send();
};

exports.head = async function (args, res, next)
{
    res.status(200).send();
};

exports.search = async function (args, res, next)
{
    const documentModel = mongoose.model('Document');

    documentModel.search({
        query_string: {
            query: 'datePosted:*'
        }
      }, function(err, results) {
          if(err) {
            Actions.sendResponseV2(res, 500, err);
          } else {
            Actions.sendResponseV2(res, 200, results);
          }
      });
};

exports.syncElasticSearch = async function (args, res, next)
{
    defaultLog.debug('>>> Starting ElasticSearch sync process');

    try
    {
        const documentModel = mongoose.model('Document');
        const projectModel = mongoose.model('Project');

        console.log('Fetching projects...');
        let projects = await projectDAO.getProjects(constants.SECURE_ROLES, 0, 10000, null, null, null);

        console.log('Creating project indexes...');
        for(let idx in projects[0].searchResults)
        {
            let proj = projects[0].searchResults[idx];
            (await projectModel.findById(proj._id)).save();
        }

        console.log('Fetching documents...');
        let documents = await documentDAO.fetchDocuments(0, 100000, null, null, null, null, null, constants.SECURE_ROLES);

        console.log('Creating document indexes...');
        for(let idx in documents[0].searchResults)
        {
            let doc = documents[0].searchResults[idx];
            (await documentModel.findById(doc._id)).save();
        }
        
        console.log('Done');
        Actions.sendResponseV2(res, 200, { code: 200, message: 'Indexing Complete'});
    }
    catch (e)
    {
        defaultLog.error('### Error in sync :', e);
        return Actions.sendResponseV2(res, 500, { code: '500', message: 'Internal Server Error', self: '/Elasticsearch' });        
    }
    finally
    {
        defaultLog.debug('<<< Ending ElasticSearch sync process');
    }
};