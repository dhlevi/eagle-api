const mongoose     = require('mongoose');
const mongoosastic = require('mongoosastic');
const defaultLog   = require('winston').loggers.get('default');
const Actions      = require('../helpers/actions');
const constants    = require('../helpers/constants');

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
        const cpModel = mongoose.model('CommentPeriod');

        defaultLog.debug(' Create document mapping...');
        documentModel.createMapping(async (err, mapping) => {
            console.log('mapping created');
            console.log('Synchronizing Document model');
            let docStream = await documentModel.synchronize(async function(error)
            {
                console.log(error);
            });

            console.log('Process complete!');
            Actions.sendResponseV2(res, 200, { code: 200, message: 'Indexing complete'});
        });

        defaultLog.debug(' Create project mapping...');
        projectModel.createMapping(async (err, mapping) => {
            console.log('mapping created');
            console.log('Synchronizing project model');
            let projectStream = await cpModel.synchronize(async function(error)
            {
                console.log(error);
            });

            console.log('Process complete!');
            Actions.sendResponseV2(res, 200, { code: 200, message: 'Indexing complete'});
        });
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