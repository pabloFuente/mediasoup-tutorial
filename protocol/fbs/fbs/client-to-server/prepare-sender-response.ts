// automatically generated by the FlatBuffers compiler, do not modify

/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */

import * as flatbuffers from 'flatbuffers';

export class PrepareSenderResponse {
  bb: flatbuffers.ByteBuffer|null = null;
  bb_pos = 0;
  __init(i:number, bb:flatbuffers.ByteBuffer):PrepareSenderResponse {
  this.bb_pos = i;
  this.bb = bb;
  return this;
}

static getRootAsPrepareSenderResponse(bb:flatbuffers.ByteBuffer, obj?:PrepareSenderResponse):PrepareSenderResponse {
  return (obj || new PrepareSenderResponse()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
}

static getSizePrefixedRootAsPrepareSenderResponse(bb:flatbuffers.ByteBuffer, obj?:PrepareSenderResponse):PrepareSenderResponse {
  bb.setPosition(bb.position() + flatbuffers.SIZE_PREFIX_LENGTH);
  return (obj || new PrepareSenderResponse()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
}

sdp():string|null
sdp(optionalEncoding:flatbuffers.Encoding):string|Uint8Array|null
sdp(optionalEncoding?:any):string|Uint8Array|null {
  const offset = this.bb!.__offset(this.bb_pos, 4);
  return offset ? this.bb!.__string(this.bb_pos + offset, optionalEncoding) : null;
}

static startPrepareSenderResponse(builder:flatbuffers.Builder) {
  builder.startObject(1);
}

static addSdp(builder:flatbuffers.Builder, sdpOffset:flatbuffers.Offset) {
  builder.addFieldOffset(0, sdpOffset, 0);
}

static endPrepareSenderResponse(builder:flatbuffers.Builder):flatbuffers.Offset {
  const offset = builder.endObject();
  builder.requiredField(offset, 4) // sdp
  return offset;
}

static createPrepareSenderResponse(builder:flatbuffers.Builder, sdpOffset:flatbuffers.Offset):flatbuffers.Offset {
  PrepareSenderResponse.startPrepareSenderResponse(builder);
  PrepareSenderResponse.addSdp(builder, sdpOffset);
  return PrepareSenderResponse.endPrepareSenderResponse(builder);
}
}