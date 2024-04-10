import * as React from "react";

import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Settings2, VideotapeIcon } from "lucide-react";
import { Switch } from "./ui/switch";

interface MainSettingDrawerDialogProps {
  sendStream: () => void;
  enableNodeMCU: boolean;
  setEnableNodeMCU: (checked: boolean) => void;
}

export function MainSettingDrawerDialog({
  sendStream,
  setEnableNodeMCU,
  enableNodeMCU,
}: MainSettingDrawerDialogProps) {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="m-2 fixed z-20 top-1 left-1">
            <Settings2 className="w-6 h-6 " />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] ">
          <DialogHeader>
            <DialogTitle>Configuration & Debugging</DialogTitle>
            <DialogDescription>
              make changes to your settings here. Click save when you are done.
            </DialogDescription>
          </DialogHeader>
          <Settings
            sendStream={sendStream}
            enableNodeMCU={enableNodeMCU}
            setEnableNodeMCU={setEnableNodeMCU}
            className="px-4"
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="m-2 fixed z-20 top-1 left-1">
          <Settings2 className="w-6 h-6 " />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Configuration & Debugging</DrawerTitle>
          <DrawerDescription>
            make changes to your settings here to configure SecurEye and NodeMCU
          </DrawerDescription>
        </DrawerHeader>
        <Settings
          sendStream={sendStream}
          setEnableNodeMCU={setEnableNodeMCU}
          enableNodeMCU={enableNodeMCU}
          className="px-4"
        />

        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

interface SettingsProps {
  sendStream: () => void;
  setEnableNodeMCU: (checked: boolean) => void;
  enableNodeMCU: boolean;
  className?: string;
}

function Settings({
  className,
  sendStream,
  setEnableNodeMCU,
  enableNodeMCU,
}: SettingsProps) {
  return (
    <>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex">
          <p>Allow NodeMCU Server Connection</p>
          <Switch
            className="ml-auto w-10 h-6"
            checked={enableNodeMCU}
            onCheckedChange={(checked: boolean) => {
              setEnableNodeMCU(checked);
              console.log(checked);
              console.log(enableNodeMCU);
            }}
          />
        </div>
        <Button variant={"secondary"} onClick={sendStream}>
          Send Stream <VideotapeIcon className="w-4 h-4 mx-4" />
        </Button>
      </div>
    </>
  );
}
