import * as React from "react";

import { cn } from "@/lib/utils";
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
import { Input } from "@/components/ui/input";
import { ArrowRight, Settings2, VideotapeIcon } from "lucide-react";

interface AdminSettingDrawerDialogProps {
  sendMessage: () => void;
  connectToSecurEye: () => void;
  acceptVideoStream: () => void;
}

export function AdminSettingDrawerDialog({
  sendMessage,
  connectToSecurEye,
  acceptVideoStream,
}: AdminSettingDrawerDialogProps) {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="m-2 fixed  top-1 left-1">
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
            sendMessage={sendMessage}
            connectToSecurEye={connectToSecurEye}
            acceptVideoStream={acceptVideoStream}
            className="px-4"
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="m-2 fixed  top-1 left-1">
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
          sendMessage={sendMessage}
          connectToSecurEye={connectToSecurEye}
          acceptVideoStream={acceptVideoStream}
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
  sendMessage: () => void;
  connectToSecurEye: () => void;
  acceptVideoStream: () => void;
  className?: string;
}

function Settings({
  className,
  sendMessage,
  connectToSecurEye,
  acceptVideoStream,
}: SettingsProps) {
  return (
    <>
      <form
        className={cn(
          "grid items-start m-1 align-bottom grid-cols-12 gap-4",
          className
        )}
      >
        <div className="col-span-8">
          <Input
            type="text"
            id="test-message"
            defaultValue="Test Signal from admin!"
          />
        </div>
        <Button type="button" className="col-span-4" onSubmit={sendMessage}>
          Send
        </Button>
      </form>
      <div className="flex flex-col gap-4 p-4">
        <Button variant={"secondary"} onClick={connectToSecurEye}>
          Connect to SecurEye <ArrowRight className="w-4 h-4 mx-4" />
        </Button>
        <Button variant={"outline"} onClick={acceptVideoStream}>
          Accept Video Stream
          <VideotapeIcon className="w-4 h-4 mx-4" />
        </Button>
      </div>
    </>
  );
}
