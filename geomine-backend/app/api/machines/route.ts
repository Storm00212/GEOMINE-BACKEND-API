import { listMachinesController, createMachineController } from "@/lib/modules/machines/machines.controller";

export const dynamic = "force-dynamic";
export const GET = listMachinesController;
export const POST = createMachineController;
