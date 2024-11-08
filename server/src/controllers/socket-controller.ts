import { create } from "@bufbuild/protobuf";
import { RtpCapabilities } from "mediasoup/node/lib/RtpParameters.js";
import { SctpStreamParameters } from "mediasoup/node/lib/types.js";
import * as SocketIO from "socket.io";

import { Logger } from "../library/logging.js";
import { Room } from "../models/room.js";
import {
  ConnectWebrtcTransportRequest,
  ConnectWebrtcTransportResponse,
  ConnectWebrtcTransportResponseSchema,
  ConsumeDataRequest,
  ConsumeDataResponse,
  ConsumeDataResponseSchema,
  ConsumeRequest,
  ConsumeResponse,
  ConsumeResponseSchema,
  CreateWebrtcTransportRequest,
  CreateWebrtcTransportResponse,
  CreateWebrtcTransportResponseSchema,
  ProduceDataRequest,
  ProduceDataResponse,
  ProduceDataResponseSchema,
  ProduceRequest,
  ProduceResponse,
  ProduceResponseSchema,
  ResumeConsumerRequest,
} from "../protocol/mediasoup_playground_pb.js";
import { RoomService } from "../services/room.service.js";

export class SocketController {
  socketServer: SocketIO.Server;
  roomService: RoomService;

  constructor(socketServer: SocketIO.Server) {
    this.socketServer = socketServer;
    this.roomService = new RoomService();
    socketServer.on("connection", (socket) => {
      Logger.info("A user connected!");

      socket.on("disconnect", () => {
        Logger.info("A user disconnected!");
      });

      socket.on(
        "createWebRtcTransport",
        async (
          request: CreateWebrtcTransportRequest,
          callback: (response: CreateWebrtcTransportResponse) => void,
        ) => {
          Logger.info("createWebRtcTransport: " + JSON.stringify(request));
          try {
            const room: Room = await this.roomService.getRoom(request.roomName);
            const routerRtpCapabilities = await room.initRouter();
            const transportOptions = await room.initWebRtcTransport();
            const response = create(CreateWebrtcTransportResponseSchema, {
              routerRtpCapabilities: JSON.stringify(routerRtpCapabilities),
              transportOptions: JSON.stringify(transportOptions),
            });
            Logger.info("createWebRtcTransport success");
            callback(response);
          } catch (err: any) {
            Logger.error("createWebRtcTransport error: ", err);
            const errorResponse = create(CreateWebrtcTransportResponseSchema, {
              error: {
                message: err.message,
              },
            });
            callback(errorResponse);
          }
        },
      );

      socket.on(
        "connectWebRtcTransport",
        async (
          request: ConnectWebrtcTransportRequest,
          callback: (response: ConnectWebrtcTransportResponse) => void,
        ) => {
          Logger.info("connectWebRtcTransport: ", request);
          try {
            const room = await this.roomService.getRoom(request.roomName);
            const transport = room.webRtcTransports.get(request.transportId);
            if (!transport) {
              Logger.error(
                "connectWebRtcTransport error: WebRtcTransport not found",
              );
              const errorResponse = create(
                ConnectWebrtcTransportResponseSchema,
                {
                  error: {
                    message:
                      "WebRtcTransport " +
                      request.transportId +
                      " not found in room " +
                      request.roomName,
                  },
                },
              );
              callback(errorResponse);
            } else {
              await transport.connect({
                dtlsParameters: JSON.parse(request.dtlsParameters),
              });
              Logger.info("connectWebRtcTransport success");
              callback(create(ConnectWebrtcTransportResponseSchema, {}));
            }
          } catch (err: any) {
            Logger.error("connectWebRtcTransport error: ", err);
            const errorResponse = create(ConnectWebrtcTransportResponseSchema, {
              error: {
                message: err.message,
              },
            });
            callback(errorResponse);
          }
        },
      );

      socket.on(
        "produce",
        async (
          request: ProduceRequest,
          callback: (response: ProduceResponse) => void,
        ) => {
          Logger.info("produce request");
          try {
            const room = await this.roomService.getRoom(request.roomName);
            const producer = await room.initProducer(
              request.transportId,
              request.kind == "audio" ? "audio" : "video",
              JSON.parse(request.rtpParameters),
            );
            const response: ProduceResponse = create(ProduceResponseSchema, {
              producerId: producer.id,
            });
            callback(response);
          } catch (err: any) {
            Logger.error("produce error: ", err);
            const errorResponse = create(ProduceResponseSchema, {
              error: {
                message: err.message,
              },
            });
            callback(errorResponse);
          }
        },
      );

      socket.on(
        "consume",
        async (
          request: ConsumeRequest,
          callback: (response: ConsumeResponse) => void,
        ) => {
          Logger.info("consume request");
          try {
            const room = await this.roomService.getRoom(request.roomName);
            const consumerRtpCapabilities: RtpCapabilities = JSON.parse(
              request.rtpCapabilities,
            );
            if (
              !room.router?.canConsume({
                producerId: request.producerId,
                rtpCapabilities: consumerRtpCapabilities,
              })
            ) {
              Logger.error("consume error: cannot consume");
              const errorResponse = create(ConsumeResponseSchema, {
                error: {
                  message: "Cannot consume",
                },
              });
              callback(errorResponse);
              return;
            }
            const consumer = await room.initConsumer(
              request.transportId,
              request.producerId,
              consumerRtpCapabilities,
            );
            const response: ConsumeResponse = create(ConsumeResponseSchema, {
              id: consumer.id,
              producerId: consumer.producerId,
              kind: consumer.kind,
              rtpParameters: JSON.stringify(consumer.rtpParameters),
            });
            callback(response);
          } catch (err: any) {
            Logger.error("produce error: ", err);
            const errorResponse = create(ConsumeResponseSchema, {
              error: {
                message: err.message,
              },
            });
            callback(errorResponse);
          }
        },
      );

      socket.on("resumeConsumer", async (request: ResumeConsumerRequest) => {
        Logger.info("resumeConsumer request");
        try {
          const room = await this.roomService.getRoom(request.roomName);
          const consumer = room.consumers.get(request.consumerId);
          if (!consumer) {
            Logger.error("resumeConsumer error: Consumer not found");
            return;
          }
          await consumer.resume();
          Logger.info("resumeConsumer success");
        } catch (err: any) {
          Logger.error("resumeConsumer error: ", err);
        }
      });

      socket.on(
        "produceData",
        async (
          request: ProduceDataRequest,
          callback: (response: ProduceDataResponse) => void,
        ) => {
          Logger.info("produceData request");
          try {
            const room = await this.roomService.getRoom(request.roomName);
            const dataProducer = await room.initDataProducer(
              request.transportId,
              JSON.parse(request.sctpStreamParameters) as SctpStreamParameters,
              request.label,
            );
            Logger.info("produceData success");

            dataProducer.on("transportclose", () => {
              Logger.warn("transport closed so dataProducer closed");
            });

            const response = create(ProduceDataResponseSchema, {
              dataProducerId: dataProducer.id,
            });
            callback(response);
          } catch (err: any) {
            Logger.error("produceData error: ", err);
            const errorResponse = create(ProduceDataResponseSchema, {
              error: {
                message: err.message,
              },
            });
            callback(errorResponse);
          }
        },
      );

      socket.on(
        "consumeData",
        async (
          request: ConsumeDataRequest,
          callback: (response: ConsumeDataResponse) => void,
        ) => {
          Logger.info("consumeData request");
          try {
            const room = await this.roomService.getRoom(request.roomName);
            const dataConsumer = await room.initDataConsumer(
              request.transportId,
              request.dataProducerId,
            );
            Logger.info("consumeData success");

            dataConsumer.on("transportclose", () => {
              Logger.warn("transport closed so dataProducer closed");
            });

            const response = create(ConsumeDataResponseSchema, {
              dataConsumerId: dataConsumer.id,
              dataProducerId: dataConsumer.dataProducerId,
              sctpStreamParameters: JSON.stringify(
                dataConsumer.sctpStreamParameters,
              ),
            });
            callback(response);
          } catch (err: any) {
            Logger.error("consumeData error: ", err);
            const errorResponse = create(ConsumeDataResponseSchema, {
              error: {
                message: err.message,
              },
            });
            callback(errorResponse);
          }
        },
      );
    });
  }
}
