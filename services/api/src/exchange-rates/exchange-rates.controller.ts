import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { ExchangeRatesRepository } from './exchange-rates.repository';

@Controller('exchange-rates')
export class ExchangeRatesController {
  constructor(private readonly repository: ExchangeRatesRepository) {}

  // Public — rates aren't user-specific, and every price display needs
  // them (including on pages a signed-out visitor can browse).
  @Public()
  @Get()
  getLatest() {
    return this.repository.getLatest();
  }
}
