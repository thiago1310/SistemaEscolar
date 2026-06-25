import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface MensagemEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

@Injectable()
export class EmailService {
  constructor(private readonly configuracao: ConfigService) {
  }

  async enviar(mensagem: MensagemEmail) {
    const host = this.configuracao.get<string>('EMAIL_HOST');
    const port = Number(this.configuracao.get<string>('EMAIL_PORT'));
    const user = this.configuracao.get<string>('EMAIL_USER');
    const pass = this.configuracao.get<string>('EMAIL_PASS');
    const from = this.configuracao.get<string>('EMAIL_FROM') ?? user;

    if (!host || !port || !user || !pass || !from) {
      throw new BadRequestException(
        'Configuracao de email incompleta. Informe EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS e EMAIL_FROM.',
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    await transporter.sendMail({
      from,
      to: mensagem.to,
      subject: mensagem.subject,
      text: mensagem.text,
      html: mensagem.html,
    });
  }
}
