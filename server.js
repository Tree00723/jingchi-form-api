const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const logPath = path.join(__dirname, 'form-log.json');

const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    auth: {
        user: '2216284642@qq.com',
        pass: 'ofyktcegwipldidc'
    }
});

transporter.verify(function (error) {
    if (error) {
        console.log('❌ SMTP连接失败：', error);
    } else {
        console.log('✅ SMTP服务就绪，可以发邮件');
    }
});

function readLogs(){
    if(!fs.existsSync(logPath)) return [];
    const raw = fs.readFileSync(logPath, 'utf8');
    try{
        return JSON.parse(raw);
    }catch(e){
        return [];
    }
}
function saveLog(data){
    const list = readLogs();
    list.push({
        ...data,
        time: new Date().toLocaleString('zh-CN')
    });
    fs.writeFileSync(logPath, JSON.stringify(list, null, 2), 'utf8');
}

app.post('/api/send-form', async (req, res) => {
    const { region, area, phone } = req.body;
    if(!region || !area || !phone){
        return res.json({success:false, msg:'表单信息不全'});
    }
    saveLog({region, area, phone});

    const mailOptions = {
        from: '京驰修缮 <2216284642@qq.com>',
        to: '2216284642@qq.com',
        subject: '【京驰修缮】新报价预约单',
        html: `
            <h3>新客户报价预约</h3>
            <p>所在区域：${region}</p>
            <p>房屋面积：${area} ㎡</p>
            <p>联系电话：${phone}</p>
            <p>提交时间：${new Date().toLocaleString('zh-CN')}</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({success:true, msg:'邮件发送成功'});
    } catch (err) {
        console.error('发送邮件报错：', err);
        res.json({success:false, msg:'邮件发送失败，但预约信息已本地保存'});
    }
})

app.listen(port, () => {
    console.log(`后端服务运行在 http://127.0.0.1:${port}`);
})
