import { Controller, Get } from "@nestjs/common";

import { Roles } from "../auth/auth.decorators";
import { ReportsService } from "./reports.service";

/** Business reporting. Admin-only: it exposes revenue across the whole league. */
@Roles("admin")
@Controller("reports")
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get("monthly")
  monthly() {
    return this.reports.monthly();
  }
}
