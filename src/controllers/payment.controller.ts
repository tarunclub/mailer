import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import mailgen from 'mailgen';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import fs from 'fs';
import pdf from 'html-pdf';
import { UploadedFile } from 'express-fileupload';

export const sendPaymentEmail = async (req: Request, res: Response) => {
  try {
    const config = {
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      auth: {
        user: process.env.EMAIL as string,
        pass: process.env.PASSWORD as string,
      },
    };

    const transporter = nodemailer.createTransport(config);

    const file = req.files?.csvFile as UploadedFile;
    if (!file || !file.data) {
      return res.status(400).json({ message: 'CSV file is missing.' });
    }

    const csvData = file.data.toString();
    const parsedData = await parseCsv(csvData);

    const rowData = parsedData[0];

    console.log(rowData);

    const {
      Employee_Name,
      Mail_ID,
      GROSS,
      Basic,
      Hra,
      'D.A.': DA,
      Tranceport_All: TranceportAll,
      Other_Allowance: OtherAllowance,
      epf_ded,
      Esi_No,
      PF_No,
      'Bank_Name ': BankName,
      'Bank_A/C_No': BankACNo,
      School_Name,
    } = rowData;

    const mailGenerator = new mailgen({
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
        outro:
          "Need help, or have questions? Just reply to this email, we'd love to help.",
      },
    };

    const emailBody = req.body.htmlContent;
    const emailText = mailGenerator.generate(emailContent);

    const pdfOptions = { format: 'Letter' };
    const pdfBuffer = await convertHtmlToPdf(emailBody, pdfOptions);

    const pdfFileName = `Payment_Details_${Employee_Name}.pdf`;
    fs.writeFileSync(pdfFileName, pdfBuffer);

    const message = {
      from: `${process.env.EMAIL}`,
      to: Mail_ID,
      subject: 'Payment Details',
      html: emailText,
      attachments: [{ filename: pdfFileName, content: pdfBuffer }],
    };

    const info = await transporter.sendMail(message);

    res.status(200).json({ message: 'Email has been sent', info });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

function parseCsv(csvData: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    const stream = new Readable();
    stream._read = () => {};
    stream.push(csvData);
    stream.push(null);

    stream
      .pipe(csvParser({}))
      .on('data', (data) => results.push(data))
      .on('end', () => {
        resolve(results);
      });
  });
}

async function convertHtmlToPdf(
  htmlContent: string,
  options: any
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    pdf.create(htmlContent, options).toBuffer((error, buffer) => {
      if (error) {
        reject(error);
      } else {
        resolve(buffer);
      }
    });
  });
}
