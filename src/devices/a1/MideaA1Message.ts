import { throws } from 'assert';
import { DeviceType } from '../../core/MideaConstants';
import { MessageBody, MessageRequest, MessageResponse, MessageType, NewProtocolMessageBody } from '../../core/MideaMessage';
import { calculate } from '../../core/MideaUtils';

enum NewProtocolTags {
  LIGHT = 0x05B
};

abstract class MessageA1Base extends MessageRequest {

  private static message_serial = 0;
  private message_id: number;

  constructor(
    device_protocol_version: number,
    message_type: MessageType,
    body_type: number,
  ) {
    super(DeviceType.DEHUMIDIFIER, message_type, body_type, device_protocol_version);
    MessageA1Base.message_serial += 1;
    if (MessageA1Base.message_serial >= 100) {
      MessageA1Base.message_serial = 1;
    };
    this.message_id = MessageA1Base.message_serial;
  };

  get body() {
    let body = Buffer.concat([Buffer.from([this.body_type]), this._body, Buffer.from([this.message_id])]);
    body = Buffer.concat([body, Buffer.from([calculate(body)])]);
    return body;
  };
};

export class MessageQuery extends MessageA1Base {

  constructor(
    device_protocol_version: number,
  ) {
    super(device_protocol_version, MessageType.QUERY, 0x41);
  };

  get _body() {
    return Buffer.from([
      0x81, 0x00, 0xFF, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00
    ]);
  };
};

export class MessageNewProtocolQuery extends MessageA1Base {
  constructor(
    device_protocol_version: number,
    private readonly alternate_display = false,
  ) {
    super(device_protocol_version, MessageType.QUERY, 0xB1);
  };

  get _body() {
    const query_params = [
      NewProtocolTags.LIGHT
    ];
    let body = Buffer.from([query_params.length]);
    for (const param of query_params) {
      if (param) {
        body = Buffer.concat([body, Buffer.from([param & 0xFF, param >> 8])]);
      };
    };
    return body;
  };
};

export class MessageSet extends MessageA1Base {

  public power: boolean;
  public prompt_tone: boolean;
  public mode: number;
  public fan_speed: number;
  public child_lock: boolean;
  public target_humidity: number;
  public swing: boolean;
  public anion: boolean;
  public water_level_set: number;

  constructor(
    device_protocol_version: number,
  ) {
    super(device_protocol_version, MessageType.SET, 0x40);
    this.power = false;
    this.prompt_tone = true;
    this.mode = 1;
    this.fan_speed = 40;
    this.child_lock = false;
    this.target_humidity = 40;
    this.swing = false;
    this.anion = false;
    this.water_level_set = 50;
  };

  get _body() {
    // byte1, power, prompt_tone
    const power = this.power ? 0x01 : 0x00;
    const prompt_tone = this.prompt_tone ? 0x40 : 0x00;
    // byte2 mode
    const mode = this.mode;
    // byte3 fan_speed
    const fan_speed = this.fan_speed;
    // byte7 target_humidity
    const target_humidity = this.target_humidity;
    // byte8 child_lock
    const child_lock = this.child_lock ? 0x80 : 0x00;
    // byte9 anion
    const anion = this.anion ? 0x40 : 0x00;
    // byte10 swing
    const swing = this.swing ? 0x08 : 0x00;
    // byte 13 water_level_set
    const water_level_set = this.water_level_set;

    return Buffer.from([
      power | prompt_tone | 0x02,
      mode,
      fan_speed,
      0x00, 0x00, 0x00,
      target_humidity,
      child_lock,
      anion,
      swing,
      0x00, 0x00,
      water_level_set,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00
    ]);
  };
};

export class MessageNewProtocolSet extends MessageA1Base {

  public light = false;

  constructor(
    device_protocol_version: number,
  ) {
    super(device_protocol_version, MessageType.SET, 0xB0);
  };

  get _body() {
    let pack_count = 0;
    let payload = Buffer.from([0x00]);

    if (this.light !== undefined) {
      pack_count += 1;
      payload = Buffer.concat([payload,
        // original python code at https://github.com/georgezhao2010/midea_ac_lan/blob/master/custom_components/midea_ac_lan/midea/devices/a1/message.py
        // used "NewProtocolTags.INDIRECT_WIND" but that is/was not defined so assumed to be a bug and should be LIGHT
        NewProtocolMessageBody.packet(NewProtocolTags.LIGHT, Buffer.from([this.light ? 0x01 : 0x00]))]);
    };

    payload[0] = pack_count;
    return payload;
  };
};

class A1GeneralMessageBody extends MessageBody {

  public power: boolean;
  public mode: number;
  public fan_speed: number;
  public target_humidity: number;
  public child_lock: boolean;
  public anion: boolean;
  public tank: number;
  public water_level_set: number;
  public current_humidity: number;
  public current_temperature: number;
  public swing: boolean;

  constructor(
    body: Buffer,
  ) {
    super(body);

    this.power = (body[1] & 0x01) > 0;
    this.mode = (body[2] & 0x0F) >> 5;
    this.fan_speed = body[3] & 0x7f;
    this.target_humidity = (body[7] < 35) ? 35 : body[7];
    this.child_lock = (body[8] & 0x80) > 0;
    this.anion = (body[9] & 0x40) > 0;
    this.tank = body[10] & 0x7F;
    this.water_level_set = body[15];
    this.current_humidity = body[16];
    this.current_temperature = (body[17] - 50) / 2;
    this.swing = (body[19] & 0x20) > 0;
    if (this.fan_speed < 5) {
      this.fan_speed = 1;
    };
  };
};

class A1NewProtocolMessageBody extends NewProtocolMessageBody {

  public light = false;

  constructor(
    body: Buffer,
    body_type: number,
  ) {
    super(body, body_type);
    const params = this.parse();

    if (NewProtocolTags.LIGHT in params) {
      this.light = (params[NewProtocolTags.LIGHT][0] > 0);
    };
  };
};

export class MessageA1Response extends MessageResponse {

  public used_subprotocol?: boolean;

  constructor(
    private readonly message: Buffer,
  ) {
    super(message);

    if (this.message_type in [MessageType.QUERY, MessageType.SET, MessageType.NOTIFY1]) {
      if (this.body_type in [0xB0, 0xB1, 0xB5]) {
        this.set_body(new A1NewProtocolMessageBody(this.body, this.body_type));
      } else {
        this.set_body(new A1GeneralMessageBody(this.body));
      };
    } else if (this.message_type == MessageType.NOTIFY2 && this.body_type == 0xA0) {
      this.set_body(new A1GeneralMessageBody(this.body));
    };
  };
};