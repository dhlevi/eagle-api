const mongoose     = require('mongoose');
const mongoosastic = require('mongoosastic');
const defaultLog   = require('winston').loggers.get('default');
const Actions      = require('../helpers/actions');
const constants    = require('../helpers/constants');
const projectDAO   = require('../dao/projectDAO');
const documentDAO  = require('../dao/documentDAO');

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

    let query = args.swagger.params.query && args.swagger.params.query.value ? args.swagger.params.query.value : 'project:58850ff6aaecd9001b808f88'
    documentModel.search({
        query_string: {
            query: query
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
            (await projectModel.findById(proj._id)).save().catch(err => { console.log(proj._id + ' failed to index. The project is invalid.') });
        }

        console.log('Fetching documents...');
        let pageSize = 1000;
        let pageCount = 0;

        while(pageCount <= 60) {
            let documents = await documentDAO.fetchDocuments(pageCount, pageSize, null, null, null, null, null, constants.SECURE_ROLES);
            console.log('Creating document indexes...');
            for(let idx in documents[0].searchResults)
            {
                let doc = documents[0].searchResults[idx];
                (await documentModel.findById(doc._id)).save().catch(err => { console.log(doc._id + ' failed to index. The document is invalid.') });
            }

            pageCount++;
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