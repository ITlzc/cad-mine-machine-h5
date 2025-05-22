'use client'

import { Popup, Form, Input, Button, Selector, Space, TextArea, Stepper, Picker } from 'antd-mobile'
import { CloseOutline } from 'antd-mobile-icons'
import { useState, useEffect } from 'react'
import { minerService } from '../services/miner-service'
import { Toast } from 'antd-mobile'
import Loading from '../components/Loading'
import { PhoneInput } from 'react-international-phone';
import { PhoneNumberUtil } from 'google-libphonenumber'
import 'react-international-phone/style.css'
import { useSearchParams } from 'next/navigation'

interface Pool {
  id: string
  name: string
  logo: string
  description: string
}

interface ExpandableTextProps {
  text: string
  maxLines?: number
}

function ExpandableText({ text, maxLines = 3 }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="relative">
      <p
        className={`text-gray-500 text-sm mt-1 ${!isExpanded ? 'line-clamp-2' : ''}`}
      >
        <div dangerouslySetInnerHTML={{ __html: text }} />
      </p>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-[#1677FF] text-xs mt-0.5"
      >
        {isExpanded ? '收起' : '展开'}
      </button>
    </div>
  )
}

interface Props {
  visible: boolean
  onClose: () => void
  onSubmit: (values: any) => void
  miner: any
  discount: number
  userInfo: any
}

export default function BuyForm({ visible, onClose, onSubmit, miner, discount, userInfo }: Props) {
  const [form] = Form.useForm()
  const [pools, setPools] = useState<Pool[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null)
  const [showPoolPicker, setShowPoolPicker] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get('inviter_code')

  const phoneUtil = PhoneNumberUtil.getInstance();

  const isPhoneValid = (phone: string) => {
    try {
      return phoneUtil.isValidNumber(phoneUtil.parseAndKeepRawInput(phone));
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    if (visible) {
      fetchPools()
    } else {
      // 关闭时重置表单
      form.resetFields()
      setSelectedPool(null)
    }
  }, [visible])

  const fetchPools = async () => {
    try {
      setLoading(true)
      const data: any = await minerService.getMiningPools()
      setPools(data?.records)
    } catch (error) {
      Toast.show({
        content: '获取矿池列表失败',
        position: 'center'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      // 使用完整的国际格式手机号
      values.phone = phoneNumber
      await onSubmit(values)
    } catch (error) {
      console.log(error)
    } finally {
      setSubmitting(false)
    }
  }


  return (
    <Popup
      visible={visible}
      onMaskClick={onClose}
      position="bottom"
      bodyStyle={{
        height: '90%',
        overflowY: 'auto',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      <div className="flex flex-col h-full bg-white">
        {/* 矿机信息 */}
        <div className="px-4 py-2 pt-4 border-b relative">
          <div className="absolute right-4 top-4">
            <CloseOutline
              className="text-gray-500 text-xl"
              onClick={onClose}
            />
          </div>
          <div className="flex space-x-4">
            <img
              src={miner.image}
              alt={miner.title}
              className="w-20 h-20 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="text-base flex max-w-[90%] font-medium">{miner.title}</h3>
              {/* <ExpandableText text={miner.description} /> */}
              <div className="text-[#F5B544] text-lg mt-2">
                {discount && Number(discount) > 0 && Number(discount) < 1 ? (
                  <div className="flex flex-col items-start">
                    <span className="text-sm text-gray-400 line-through">
                      原价：{miner.currency_type === 'BSC_USDT' ? `$${miner.price} U` : `${miner.price} CAD`}
                    </span>
                    <span className="text-base font-bold text-[#F5B544]">
                      {miner.currency_type === 'BSC_USDT' ? `$${miner.price * (discount)} U` : `${miner.price * (discount)} CAD`}
                    </span>
                  </div>
                ) : <span className="text-base font-bold text-[#F5B544]">
                  {miner.currency_type === 'BSC_USDT' ? `$${miner.price} U` : `${miner.price} CAD`}
                </span>}
              </div>
            </div>
          </div>
        </div>

        {/* 表单部分 */}
        <div className="flex-1 overflow-auto">
          <Form
            form={form}
            layout="horizontal"
            className="py-4"
            requiredMarkStyle="none"
            initialValues={{
              MPQ: miner.MPQ,
            }}
            style={{
              '--prefix-width': '5.5em'
            } as any}
            footer={
              <Button
                block
                color="primary"
                size="large"
                onClick={handleSubmit}
                loading={submitting}
                disabled={submitting}
                className="!rounded-[10px] !border-none !bg-[#F5B544]"
              >
                立即购买
              </Button>
            }
          >
            <div className="mb-4">
              {/* <div className="mb-2 px-4 py-2 text-sm text-[var(--adm-color-text-secondary)]">选择矿池</div> */}
              {
                <Form.Item
                  name="poolId"
                  label="选择矿池"
                  rules={[{ required: true, message: '请选择矿池' }]}
                  className="!text-base adm-form-item-horizontal"
                >
                  <div
                    className="px-3 py-2 border rounded-lg cursor-pointer text-sm flex justify-between items-center"
                    onClick={() => setShowPoolPicker(true)}
                  >
                    <span>{selectedPool ? selectedPool.name : '请选择矿池'}</span>
                    <span className="text-gray-400">▼</span>
                  </div>
                </Form.Item>
              }
            </div>

            <Popup
              visible={showPoolPicker}
              onMaskClick={() => setShowPoolPicker(false)}
              position="bottom"
              bodyStyle={{
                height: '80%',
                overflowY: 'auto',
                paddingBottom: 'env(safe-area-inset-bottom)'
              }}
            >
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center p-4 border-b">
                  <div className="text-lg font-medium">选择矿池</div>
                  <CloseOutline
                    className="text-gray-500 text-xl"
                    onClick={() => setShowPoolPicker(false)}
                  />
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    {loading ? <Loading /> : pools.map(pool => (
                      <div
                        key={pool.id}
                        className={`p-3 border rounded-lg cursor-pointer ${selectedPool?.id === pool.id ? 'border-[#F5B544] bg-[#FFF9E8]' : 'border-gray-200'}`}
                        onClick={() => {
                          setSelectedPool(pool)
                          form.setFieldValue('poolId', pool.id)
                          form.validateFields(['poolId'])
                            .then(() => {
                              // 验证通过，关闭弹窗
                              setShowPoolPicker(false)
                            })
                            .catch(() => {
                              // 验证失败，保持弹窗打开
                              console.log('验证失败')
                            })
                        }}
                      >
                        <div className="flex items-start">
                          <img src={pool.logo} alt={pool.name} className="w-8 h-8 mr-3 mt-0.5" />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{pool.name}</div>
                            <div className="text-xs text-gray-500 mt-1">{pool.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Popup>

            <Form.Item
              name="quantity"
              label="购买数量"
              rules={[
                { required: true, message: '请输入购买数量' },
                {
                  validator: (_, value) => {
                    if (value < miner.MPQ) {
                      return Promise.reject(`${miner.MPQ}台起订`)
                    }
                    return Promise.resolve()
                  }
                }
              ]}
              initialValue={miner.MPQ}
              className="!text-base adm-form-item-horizontal"
            >
              <Stepper
                min={miner.MPQ}
                className="!text-sm"
                defaultValue={miner.MPQ}
                onChange={(value) => form.setFieldValue('quantity', value)}
              />
              <div className="text-xs text-gray-500 mt-1">
                {miner.MPQ}台起订
              </div>
            </Form.Item>

            {miner.good_type === 1 && <>
              <Form.Item
                name="receiver"
                label="收货人"
                rules={[{ required: true, message: '请输入收货人姓名' }]}
                className="!text-base adm-form-item-horizontal"
              >
                <Input placeholder="请填写收货人姓名" className="!text-sm !placeholder:text-xs" />
              </Form.Item>

              <Form.Item
                name="phone"
                label="手机号码"
                rules={[
                  { required: true, message: '请输入手机号码' },
                  {
                    validator: (_, value) => {
                      if (!phoneNumber || !isPhoneValid(phoneNumber)) {
                        return Promise.reject('请输入有效的手机号码')
                      }
                      return Promise.resolve()
                    }
                  }
                ]}
                className="!text-base adm-form-item-horizontal"
              >
                <div className="w-full">
                  <PhoneInput
                    defaultCountry="cn"
                    value={phoneNumber}
                    onChange={(phone) => setPhoneNumber(phone)}
                    inputClassName="!text-[16px] !leading-[16px] !w-full !h-[40px] !px-3 !py-2 !border !border-gray-300 !rounded-lg"
                    countrySelectorStyleProps={{
                      buttonClassName: "!h-[40px] !px-3 !py-2 !border !border-gray-300 !rounded-lg !mr-2",
                      dropdownStyleProps: {
                        className: "!text-[16px]"
                      }
                    }}
                    preferredCountries={['cn', 'hk', 'mo', 'tw', 'us', 'gb', 'jp', 'kr', 'sg']}
                    inputProps={{
                      autoComplete: "off",
                      autoCorrect: "off",
                      autoCapitalize: "off",
                      spellCheck: "false",
                      style: {
                        fontSize: '16px',
                        lineHeight: '16px'
                      }
                    }}
                  />
                </div>
              </Form.Item>

              <Form.Item
                name="address"
                label="收货地址"
                rules={[{ required: true, message: '请输入详细地址' }]}
                className="!text-base adm-form-item-horizontal"
              >
                <TextArea
                  placeholder="请填写详细地址"
                  rows={3}
                  className="!text-sm placeholder:text-xs"
                />
              </Form.Item>
              <Form.Item
                name="postcode"
                label="邮政编码"
                rules={[
                  { pattern: /^[0-9]{6}$/, message: '请输入正确的邮政编码' }
                ]}
                className="!text-base adm-form-item-horizontal"
              >
                <Input placeholder="请填写邮政编码" className="!text-sm placeholder:text-xs" />
              </Form.Item>
            </>}

            {/* 邀请码（可选） */}
            {userInfo?.role === 0 && miner.can_use_invite_code === 1 &&  <Form.Item
              name="inviteCode"
              label="邀请码"
              className="!text-base adm-form-item-horizontal"
              initialValue={inviteCode || ''}
              rules={[{
                validator: (_, value) => {
                  if (value && value.length !== 12) {
                    return Promise.reject('请输入正确的邀请码')
                  }
                  return Promise.resolve()
                }
              }]}
            >
              <Input placeholder="邀请码（可选）" className="!text-sm placeholder:text-xs" />
            </Form.Item>}
          </Form>
        </div>
      </div>
    </Popup>
  )
} 