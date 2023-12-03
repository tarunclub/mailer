"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPaymentEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const mailgen_1 = __importDefault(require("mailgen"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const stream_1 = require("stream");
const fs_1 = __importDefault(require("fs"));
const html_pdf_1 = __importDefault(require("html-pdf"));
const sendPaymentEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const config = {
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            },
        };
        const transporter = nodemailer_1.default.createTransport(config);
        const file = (_a = req.files) === null || _a === void 0 ? void 0 : _a.csvFile;
        if (!file || !file.data) {
            return res.status(400).json({ message: 'CSV file is missing.' });
        }
        const csvData = file.data.toString();
        const parsedData = yield parseCsv(csvData);
        const rowData = parsedData[0];
        console.log(rowData);
        const { Employee_Name, Mail_ID, GROSS, Basic, Hra, 'D.A.': DA, Tranceport_All: TranceportAll, Other_Allowance: OtherAllowance, epf_ded, Esi_No, PF_No, 'Bank_Name ': BankName, 'Bank_A/C_No': BankACNo, School_Name, } = rowData;
        const mailGenerator = new mailgen_1.default({
            theme: 'default',
            product: {
                name: `${School_Name}`,
                link: 'https://mailgen.js/',
            },
        });
        const emailContent = {
            body: {
                name: Employee_Name,
                intro: `Welcome to ${School_Name}! We’re very excited to have you on board. Your payment details are as follows:`,
                table: {
                    data: [
                        {
                            item: 'Gross Salary',
                            description: `INR ${GROSS}`,
                        },
                        {
                            item: 'Basic Salary',
                            description: `INR ${Basic}`,
                        },
                        {
                            item: 'HRA',
                            description: `INR ${Hra}`,
                        },
                        {
                            item: 'D.A.',
                            description: `INR ${DA}`,
                        },
                        {
                            item: 'Tranceport Allowance',
                            description: `INR ${TranceportAll}`,
                        },
                        {
                            item: 'Other Allowance',
                            description: `INR ${OtherAllowance}`,
                        },
                        {
                            item: 'EPF Deduction',
                            description: `INR ${epf_ded}`,
                        },
                        {
                            item: 'ESI Number',
                            description: `${Esi_No}`,
                        },
                        {
                            item: 'PF Number',
                            description: `${PF_No}`,
                        },
                        {
                            item: 'Bank Name',
                            description: `${BankName}`,
                        },
                        {
                            item: 'Bank Account Number',
                            description: `${BankACNo}`,
                        },
                    ],
                },
                outro: "Need help, or have questions? Just reply to this email, we'd love to help.",
            },
        };
        const emailBody = req.body.htmlContent;
        const emailText = mailGenerator.generate(emailContent);
        const pdfOptions = { format: 'Letter' };
        const pdfBuffer = yield convertHtmlToPdf(emailBody, pdfOptions);
        const pdfFileName = `Payment_Details_${Employee_Name}.pdf`;
        fs_1.default.writeFileSync(pdfFileName, pdfBuffer);
        const message = {
            from: `${process.env.EMAIL}`,
            to: Mail_ID,
            subject: 'Payment Details',
            html: emailText,
            attachments: [{ filename: pdfFileName, content: pdfBuffer }],
        };
        const info = yield transporter.sendMail(message);
        res.status(200).json({ message: 'Email has been sent', info });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.sendPaymentEmail = sendPaymentEmail;
function parseCsv(csvData) {
    return new Promise((resolve, reject) => {
        const results = [];
        const stream = new stream_1.Readable();
        stream._read = () => { };
        stream.push(csvData);
        stream.push(null);
        stream
            .pipe((0, csv_parser_1.default)({}))
            .on('data', (data) => results.push(data))
            .on('end', () => {
            resolve(results);
        });
    });
}
function convertHtmlToPdf(htmlContent, options) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            html_pdf_1.default.create(htmlContent, options).toBuffer((error, buffer) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(buffer);
                }
            });
        });
    });
}
