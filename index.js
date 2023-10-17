const express = require('express') //express를 설치했기 때문에 가져올 수 있다.
const app = express()
const multer  = require('multer')
const fs = require('fs')
const bodyParser = require('body-parser');
const path = require('path');




const { fork } = require('child_process');
const mysql = require('./db')();
const connection = mysql.init();
mysql.db_open(connection);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const diskPath = __dirname; // 디스크 루트 경로

// 용량 확인 함수
function checkDiskSpace(diskPath, callback) {
    fs.stat(diskPath, (err, stats) => {
        if (err) {
            return callback(err, null);
        }

        const totalSizeInBytes = stats.blocks * stats.blksize;
        const freeSizeInBytes = stats.bfree * stats.blksize;
        console.log("test", stats)
        const totalSizeInGB = totalSizeInBytes / (1024 * 1024 * 1024);
        const freeSizeInGB = freeSizeInBytes / (1024 * 1024 * 1024);

        callback(null, { totalSizeInGB, freeSizeInGB });
    });
}

const storage = multer.diskStorage({
	destination: (req, file, cb) => {  // 파일이 업로드될 경로 설정
		const { category } = req.body
        const path = `home/caitory/diplomat_upload/${category}/`
        if(!existsSync(uploadPath)){
            //upload 폴더가 존재하지 않을 시 생성
            mkdirSync(uploadPath);
        }
        console.log("test file", path)
        callback(null, uploadPath);
	},
	filename: (req, file, cb) => {	// timestamp를 이용해 새로운 파일명 설정
		let newFileName = new Date().valueOf() + path.extname(file.originalname)
		cb(null, newFileName)
	},
})

const upload = multer({ storage: storage })

app.get('/files', (req, res) => {
    const { category, offset, limit, order } = req.query
    //const params = [category, order, parseInt(limit), parseInt(offset)]
    if(category){

        let query = 'SELECT * FROM contents WHERE content_category = ?';
        const params = [category];
        
        connection.query(query, params, (err, results) => {
            if(err){
                console.log(err)
            }
            if(results?.length == 0){
               return res.sendStatus(404) 
            }else{
                if(limit || offset){
                    const parsedLimit = parseInt(limit);
                    const parsedOffset = parseInt(offset);
                    
                    if (isNaN(parsedLimit) || isNaN(parsedOffset)) {
                        return res.status(400).json({ error: 'Invalid limit or offset values' });
                    }
                    
                    query += ' LIMIT ? OFFSET ?';
                    params.push(parsedLimit, parsedOffset);
                }
                //어떤 기준으로 할건지 ?
                if (order) {
                    if(order == '+create_at'){
                        query += ' ORDER BY content_create_at ASC';
                        params.push(order);
                    }else if(order == '-create_at'){
                        query += ' ORDER BY content_create_at DESC';
                        params.push(order);
                    }
                    
                }
            
                connection.query(query, params, (err, results, fields) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({ error: 'Internal Server Error' });
                    }
                    return res.send(results);
                });
            }
        })
    }else{
        let query = 'SELECT * FROM contents';
        connection.query(query, (err, results, fields) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            return res.send(results);
        });
    }


    
}) 

app.delete('/files/:file_id', (req, res) => {
    const { file_id } = req.params
    connection.query('SELECT * FROM contents WHERE(content_id = ?)', file_id,
    function(err, results){
        if(results?.length == 0){
            return res.sendStatus(404)
        }else{
            var dataList = [];
            for (var data of results){
                dataList.push(data.content_path);
              };
            fs.unlink(dataList[0], (err) => {
                console.log(err)
            })
            connection.query('DELETE FROM contents WHERE(content_id = ?)', file_id, 
            function(err, results, fields){
                if(err){
                    console.log(err)
                }
                console.log(results)
                return res.sendStatus(204)
            })
        }
    })

})
//const uploadSingleImage = upload.single('file');

app.post('/uploadFile', upload.single('file'), (req, res, err) => {
    const { name, category } = req.body;

    // 디스크 용량 확인
    checkDiskSpace(diskPath, (error, diskSpace) => {
        if (error) {
            console.error('Error checking disk space:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        const { totalSizeInGB, freeSizeInGB } = diskSpace;
        console.log(diskSpace)
        // 디스크 용량이 꽉 찼을 경우 에러 처리
        if (freeSizeInGB < 1) { // 예를 들어, 1GB 이하로 여유 공간이 없다고 가정
            console.error('Disk is full.');
            return res.status(500).json({ error: 'not enough space' });
        }

        const path = req.file?.path;
        console.log("path", req.body, name, category, path);

        let query = 'INSERT INTO contents (content_name, content_path, content_category) VALUES(?, ?, ?)';
        let param = [name, path, category];

        let selectQuery = 'SELECT * FROM contents WHERE (content_name = ?)'

        connection.query(selectQuery, name, function(err, results){
            if(results?.length !== 0){
                return res.status(400).json({message : 'file name already taken'})
            }else{
                connection.query(query, param, function (err, results, fields) {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ error: 'Internal Server Error' });
                    }
                    return res.sendStatus(201)
                });
            }
        })

      
    });
});


app.listen(4000)